import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSendMessage, useGetOrCreateDM } from "../hooks/useChat";
import { supabase } from "../lib/supabase";

// Mock the supabase client
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useChat hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSendMessage", () => {
    it("should send a message successfully", async () => {
      const { result } = renderHook(() => useSendMessage(), { wrapper });
      const { mutateAsync: sendMessage } = result.current;

      const mockMessage = {
        conversationId: "conv-1",
        senderId: "user-1",
        content: "Hello, world!",
      };
      const mockResponse = { id: "msg-1", ...mockMessage };

      const fromMock = vi.mocked(supabase.from);
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockResponse, error: null }),
        }),
      });
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      });

      fromMock.mockImplementation((table) => {
        if (table === "messages") {
          return { insert: insertMock } as any;
        }
        if (table === "conversations") {
          return { update: updateMock } as any;
        }
        return {} as any;
      });

      await sendMessage(mockMessage);

      expect(fromMock).toHaveBeenCalledWith("messages");
      expect(insertMock).toHaveBeenCalledWith({
        conversation_id: mockMessage.conversationId,
        sender_id: mockMessage.senderId,
        content: mockMessage.content,
      });
      expect(fromMock).toHaveBeenCalledWith("conversations");
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          last_message_at: expect.any(String),
          last_message_preview: mockMessage.content.substring(0, 100),
        })
      );
    });

    it("should handle send message error", async () => {
      const { result } = renderHook(() => useSendMessage(), { wrapper });
      const { mutateAsync: sendMessage } = result.current;

      const mockMessage = {
        conversationId: "conv-1",
        senderId: "user-1",
        content: "Hello, world!",
      };
      const mockError = new Error("Failed to insert message");

      const fromMock = vi.mocked(supabase.from);
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: null, error: mockError }),
        }),
      });

      fromMock.mockImplementation((table) => {
        if (table === "messages") {
          return { insert: insertMock } as any;
        }
        return {} as any;
      });

      await expect(sendMessage(mockMessage)).rejects.toThrow(
        "Failed to insert message"
      );
    });
  });

  describe("useGetOrCreateDM", () => {
    it("should return an existing DM conversation", async () => {
      const { result } = renderHook(() => useGetOrCreateDM(), { wrapper });
      const { mutateAsync: getOrCreateDM } = result.current;

      const mockExistingConversation = { id: "dm-conv-1", is_group: false };
      const rpcMock = vi.mocked(supabase.rpc);
      rpcMock.mockResolvedValueOnce({
        data: [mockExistingConversation],
        error: null,
      });

      const conversation = await getOrCreateDM({
        userId1: "user-1",
        userId2: "user-2",
      });

      expect(rpcMock).toHaveBeenCalledWith("get_direct_conversation", {
        user1_id: "user-1",
        user2_id: "user-2",
      });
      expect(conversation).toEqual(mockExistingConversation);
    });

    it("should create a new DM conversation if none exists", async () => {
      const { result } = renderHook(() => useGetOrCreateDM(), { wrapper });
      const { mutateAsync: getOrCreateDM } = result.current;

      const mockNewConversation = {
        id: "new-dm-conv-1",
        is_group: false,
        created_by: "user-1",
      };

      const rpcMock = vi.mocked(supabase.rpc);
      rpcMock.mockResolvedValueOnce({ data: [], error: null }); // No existing DM

      const fromMock = vi.mocked(supabase.from);
      const insertConversationMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockNewConversation, error: null }),
        }),
      });
      const insertMembersMock = vi.fn().mockResolvedValueOnce({ error: null });

      fromMock.mockImplementation((table) => {
        if (table === "conversations") {
          return { insert: insertConversationMock } as any;
        }
        if (table === "conversation_members") {
          return { insert: insertMembersMock } as any;
        }
        return {} as any;
      });

      const conversation = await getOrCreateDM({
        userId1: "user-1",
        userId2: "user-2",
      });

      expect(rpcMock).toHaveBeenCalledWith("get_direct_conversation", {
        user1_id: "user-1",
        user2_id: "user-2",
      });
      expect(fromMock).toHaveBeenCalledWith("conversations");
      expect(insertConversationMock).toHaveBeenCalledWith({
        is_group: false,
        created_by: "user-1",
      });
      expect(fromMock).toHaveBeenCalledWith("conversation_members");
      expect(insertMembersMock).toHaveBeenCalledWith([
        { conversation_id: mockNewConversation.id, user_id: "user-1" },
        { conversation_id: mockNewConversation.id, user_id: "user-2" },
      ]);
      expect(conversation).toEqual(mockNewConversation);
    });

    it("should handle error when creating new DM conversation", async () => {
      const { result } = renderHook(() => useGetOrCreateDM(), { wrapper });
      const { mutateAsync: getOrCreateDM } = result.current;

      const mockError = new Error("Failed to create conversation");

      const rpcMock = vi.mocked(supabase.rpc);
      rpcMock.mockResolvedValueOnce({ data: [], error: null }); // No existing DM

      const fromMock = vi.mocked(supabase.from);
      const insertConversationMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: null, error: mockError }),
        }),
      });

      fromMock.mockImplementation((table) => {
        if (table === "conversations") {
          return { insert: insertConversationMock } as any;
        }
        return {} as any;
      });

      await expect(
        getOrCreateDM({ userId1: "user-1", userId2: "user-2" })
      ).rejects.toThrow("Failed to create conversation");
    });
  });
});
