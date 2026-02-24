import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles, ChevronRight, Search } from "lucide-react";

interface ChecklistTemplate {
  id: string;
  title: string;
  type: "pre_exam" | "post_exam" | "custom";
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  description?: string;
  questions?: any[];
}

interface CustomChecklistSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  customTemplates: ChecklistTemplate[];
  onSelectTemplate: (template: ChecklistTemplate) => void;
}

export const CustomChecklistSelector: React.FC<
  CustomChecklistSelectorProps
> = ({ isOpen, onClose, customTemplates, onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTemplates = customTemplates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description &&
        template.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full text-left overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-50 rounded-xl text-yellow-600">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Custom Checklists
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Select a template or create new
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {/* Actions & Search */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all outline-none text-sm"
                  />
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid gap-3">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <motion.button
                      key={template.id}
                      onClick={() => onSelectTemplate(template)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="group flex items-center justify-between p-4 bg-white hover:bg-yellow-50/50 border border-gray-200 hover:border-yellow-200 rounded-xl transition-all shadow-sm hover:shadow-md text-left w-full"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-semibold text-gray-800 group-hover:text-yellow-700 truncate text-base">
                          {template.title}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-medium">
                          <span>
                            Created{" "}
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className="text-gray-300 group-hover:text-yellow-500 transition-colors"
                        size={20}
                      />
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Search size={24} />
                    </div>
                    <p className="text-gray-500 font-medium">
                      No templates found
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Try a different search or create a new one
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">
                Showing {filteredTemplates.length} templates
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
