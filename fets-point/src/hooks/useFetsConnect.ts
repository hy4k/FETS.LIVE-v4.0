import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useEffect } from 'react'

const STALE_TIME = 30000 // 30 seconds

// --- Posts, Likes, and Comments ---

const fetchPosts = async () => {
  const { data, error } = await supabase
    .from('social_posts')
    .select(`
      *,
      author:staff_profiles!posts_author_id_fkey(full_name, avatar_url, role, department),
      likes:social_post_likes(user_id),
      comments:social_post_comments(
        *,
        author:staff_profiles!post_comments_author_id_fkey(full_name, avatar_url)
      )
    `)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const usePosts = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const postChanges = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_posts' },
        () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_post_likes' },
        () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_post_comments' },
        () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(postChanges)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['posts'],
    queryFn: () => fetchPosts(),
    staleTime: STALE_TIME,
  })
}

export const usePostMutations = () => {
  const queryClient = useQueryClient()

  const invalidatePosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] })

  const addPost = useMutation({
    mutationFn: async (newPost: { content: string; author_id: string, author: any }) => {
      const { data, error } = await supabase.from('social_posts').insert({ content: newPost.content, author_id: newPost.author_id }).select().single()
      if (error) throw error
      return data
    },
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])

      const optimisticPost = {
        ...newPost,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        likes: [],
        comments: [],
      }

      queryClient.setQueryData(['posts'], (old: any) => [optimisticPost, ...old])

      return { previousPosts, optimisticPost }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['posts'], (old: any) =>
        old.map((post: any) => (post.id === context.optimisticPost.id ? data : post))
      );
      toast.success('Post created!')
    },
    onError: (err, newPost, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const toggleLike = useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase.from('social_post_likes').delete().match({ post_id: postId, user_id: userId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('social_post_likes').insert({ post_id: postId, user_id: userId })
        if (error) throw error
      }
    },
    onMutate: async ({ postId, userId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])

      queryClient.setQueryData(['posts'], (old: any) => {
        return old.map((post: any) => {
          if (post.id === postId) {
            const newLikes = isLiked
              ? post.likes.filter((like: any) => like.user_id !== userId)
              : [...post.likes, { user_id: userId }]
            return { ...post, likes: newLikes }
          }
          return post
        })
      })

      return { previousPosts }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const addComment = useMutation({
    mutationFn: async (newComment: { post_id: string; author_id: string; content: string; author: any }) => {
      const { data, error } = await supabase.from('social_post_comments').insert({ post_id: newComment.post_id, author_id: newComment.author_id, content: newComment.content }).select().single()
      if (error) throw error
      return data
    },
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])

      const optimisticComment = {
        ...newComment,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData(['posts'], (old: any) => {
        return old.map((post: any) => {
          if (post.id === newComment.post_id) {
            return { ...post, comments: [...post.comments, optimisticComment] }
          }
          return post
        })
      })

      return { previousPosts, optimisticComment }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['posts'], (old: any) =>
        old.map((post: any) => {
          if (post.id === variables.post_id) {
            return {
              ...post,
              comments: post.comments.map((comment: any) =>
                comment.id === context.optimisticComment.id ? data : comment
              ),
            }
          }
          return post
        })
      )
      toast.success('Comment added!')
    },
    onError: (err, newComment, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const updatePost = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { error } = await supabase
        .from('social_posts')
        .update({ content })
        .eq('id', postId)
      if (error) throw error
    },
    onMutate: async ({ postId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])

      queryClient.setQueryData(['posts'], (old: any) => {
        return old.map((post: any) => {
          if (post.id === postId) {
            return { ...post, content }
          }
          return post
        })
      })

      return { previousPosts }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)
      if (error) throw error
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])

      queryClient.setQueryData(['posts'], (old: any) => {
        return old.filter((post: any) => post.id !== postId)
      })

      return { previousPosts }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const updateComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { error } = await supabase
        .from('social_post_comments')
        .update({ content })
        .eq('id', commentId)
      if (error) throw error
    },
    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])

      queryClient.setQueryData(['posts'], (old: any) => {
        return old.map((post: any) => {
          return {
            ...post,
            comments: post.comments.map((comment: any) => {
              if (comment.id === commentId) {
                return { ...comment, content }
              }
              return comment
            }),
          }
        })
      })

      return { previousPosts }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('social_post_comments')
        .delete()
        .eq('id', commentId)
      if (error) throw error
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      const previousPosts = queryClient.getQueryData(['posts'])

      queryClient.setQueryData(['posts'], (old: any) => {
        return old.map((post: any) => {
          return {
            ...post,
            comments: post.comments.filter((comment: any) => comment.id !== commentId),
          }
        })
      })

      return { previousPosts }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return {
    addPost: addPost.mutateAsync,
    toggleLike: toggleLike.mutateAsync,
    addComment: addComment.mutateAsync,
    updatePost: updatePost.mutateAsync,
    deletePost: deletePost.mutateAsync,
    updateComment: updateComment.mutateAsync,
    deleteComment: deleteComment.mutateAsync,
  }
}

// --- Tasks ---

const fetchTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_tasks')
    .select(`
      *,
      assigned_by:profiles!assigned_by(full_name)
    `)
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const useTasks = (userId: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const subscription = supabase
      .channel(`public:user_tasks:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_tasks', filter: `assigned_to=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [queryClient, userId])

  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: () => fetchTasks(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
  })
}

export const useTaskMutations = (userId: string) => {
  const queryClient = useQueryClient()

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ['tasks', userId] })

  const addTask = useMutation({
    mutationFn: async (newTask: { title: string; description?: string; assigned_to: string; assigned_by: string; due_date?: string }) => {
      const { data, error } = await supabase.from('user_tasks').insert(newTask).select().single()
      if (error) throw error
      return data
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', userId] })
      const previousTasks = queryClient.getQueryData(['tasks', userId])

      const optimisticTask = {
        ...newTask,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        status: 'pending',
      }

      queryClient.setQueryData(['tasks', userId], (old: any) => [optimisticTask, ...old])

      return { previousTasks, optimisticTask }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['tasks', userId], (old: any) =>
        old.map((task: any) => (task.id === context.optimisticTask.id ? data : task))
      );
      toast.success('Task created successfully!')
    },
    onError: (err, newTask, context) => {
      queryClient.setQueryData(['tasks', userId], context.previousTasks)
      toast.error(`Error creating task: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    },
  })

  const updateTask = useMutation({
    mutationFn: async (updatedTask: { id: string; title?: string; description?: string; status?: 'pending' | 'in_progress' | 'completed' }) => {
      const { error } = await supabase.from('user_tasks').update(updatedTask).eq('id', updatedTask.id)
      if (error) throw error
    },
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', userId] })
      const previousTasks = queryClient.getQueryData(['tasks', userId])

      queryClient.setQueryData(['tasks', userId], (old: any) => {
        return old.map((task: any) => {
          if (task.id === updatedTask.id) {
            return { ...task, ...updatedTask }
          }
          return task
        })
      })

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', userId], context.previousTasks)
      toast.error(`Error updating task: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] })
    },
  })

  return {
    addTask: addTask.mutateAsync,
    isAdding: addTask.isPending,
    updateTask: updateTask.mutateAsync,
    isUpdating: updateTask.isPending,
  }
}

// --- Staff Profiles for Online List ---

const fetchStaffProfiles = async () => {
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, full_name, avatar_url, role, department')
    .order('full_name')

  if (error) throw new Error(error.message)
  return data || []
}

export const useOnlineStaff = () => {
  return useQuery({
    queryKey: ['staffProfiles'],
    queryFn: () => fetchStaffProfiles(),
    staleTime: STALE_TIME * 5, // Staff list doesn't change often
  })
}

// --- All Staff for Task Assignment ---
const fetchAllStaff = async () => {
  const { data, error } = await supabase.from('staff_profiles').select('id, user_id, full_name, role, avatar_url')
  if (error) throw new Error(error.message)
  return data || []
}

export const useAllStaff = () => {
  return useQuery({
    queryKey: ['allStaff'],
    queryFn: fetchAllStaff,
    staleTime: Infinity, // Staff list is relatively static
  })
}

// --- Kudos ---

const fetchKudos = async () => {
  const { data, error } = await supabase
    .from('kudos')
    .select(`
      *,
      giver:profiles!giver_id(full_name, avatar_url),
      receiver:profiles!receiver_id(full_name, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const useKudos = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const subscription = supabase
      .channel('public:kudos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kudos' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kudos'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['kudos'],
    queryFn: fetchKudos,
    staleTime: STALE_TIME,
  })
}

export const useKudosMutations = () => {
  const queryClient = useQueryClient()

  const invalidateKudos = () => queryClient.invalidateQueries({ queryKey: ['kudos'] })

  const addKudos = useMutation({
    mutationFn: async (newKudos: { giver_id: string; receiver_id: string; message: string; giver: any; receiver: any }) => {
      const { data, error } = await supabase.from('kudos').insert({ giver_id: newKudos.giver_id, receiver_id: newKudos.receiver_id, message: newKudos.message }).select().single()
      if (error) throw error
      return data
    },
    onMutate: async (newKudos) => {
      await queryClient.cancelQueries({ queryKey: ['kudos'] })
      const previousKudos = queryClient.getQueryData(['kudos'])

      const optimisticKudos = {
        ...newKudos,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData(['kudos'], (old: any) => [optimisticKudos, ...old])

      return { previousKudos, optimisticKudos }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['kudos'], (old: any) =>
        old.map((kudo: any) => (kudo.id === context.optimisticKudos.id ? data : kudo))
      );
      toast.success('Kudos given!')
    },
    onError: (err, newKudos, context) => {
      queryClient.setQueryData(['kudos'], context.previousKudos)
      toast.error(`Error: ${err.message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kudos'] })
    },
  })

  return { addKudos: addKudos.mutateAsync }
}