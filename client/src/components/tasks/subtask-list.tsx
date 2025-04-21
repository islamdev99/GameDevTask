import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { getSubtasksByTask, updateSubtask, deleteSubtask, updateSubtasksOrder } from "@/lib/indexedDb";
import { Check, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SubtaskForm from "./subtask-form";

interface Subtask {
  id: number;
  title: string;
  isCompleted: boolean;
  taskId: number;
  order: number;
}

interface SubtaskListProps {
  taskId: number;
}

export default function SubtaskList({ taskId }: SubtaskListProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchSubtasks = async () => {
    try {
      if (!taskId) return;
      setLoading(true);
      const data = await getSubtasksByTask(taskId);
      // Sort by order
      setSubtasks(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Failed to fetch subtasks:", error);
      toast({
        title: "Error",
        description: "Failed to load subtasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const handleToggleComplete = async (subtaskId: number, isCompleted: boolean) => {
    try {
      await updateSubtask(subtaskId, { isCompleted });
      setSubtasks(subtasks.map(st => 
        st.id === subtaskId ? { ...st, isCompleted } : st
      ));
    } catch (error) {
      console.error("Failed to update subtask:", error);
      toast({
        title: "Error",
        description: "Failed to update subtask",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (subtaskId: number) => {
    try {
      await deleteSubtask(subtaskId);
      setSubtasks(subtasks.filter(st => st.id !== subtaskId));
      toast({
        title: t("subtasks.title"),
        description: t("subtasks.deleted"),
      });
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      toast({
        title: "Error",
        description: "Failed to delete subtask",
        variant: "destructive",
      });
    }
  };

  const onDragEnd = async (result: any) => {
    // Dropped outside the list
    if (!result.destination) return;
    
    const items = Array.from(subtasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));
    
    setSubtasks(updatedItems);
    
    // Save new order to database
    try {
      await updateSubtasksOrder(updatedItems.map(item => ({ 
        id: item.id, 
        order: item.order 
      })));
    } catch (error) {
      console.error("Failed to update subtask order:", error);
      toast({
        title: "Error",
        description: "Failed to update subtask order",
        variant: "destructive",
      });
      // Revert to original order on error
      fetchSubtasks();
    }
  };

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">{t("app.loading")}</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{t("subtasks.title")}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? t("actions.cancel") : t("subtasks.add")}
        </Button>
      </div>

      {showForm && (
        <div className="mb-3">
          <SubtaskForm 
            taskId={taskId} 
            onSuccess={() => {
              fetchSubtasks();
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {subtasks.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">{t("subtasks.empty")}</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="subtasks">
            {(provided) => (
              <ul
                className="space-y-2"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {subtasks.map((subtask, index) => (
                  <Draggable 
                    key={subtask.id} 
                    draggableId={subtask.id.toString()} 
                    index={index}
                  >
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center justify-between bg-secondary/30 rounded-md p-2 group"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div 
                            className="text-muted-foreground cursor-move px-1" 
                            {...provided.dragHandleProps}
                          >
                            <GripVertical size={16} />
                          </div>
                          <Checkbox 
                            checked={subtask.isCompleted} 
                            onCheckedChange={(checked) => 
                              handleToggleComplete(subtask.id, !!checked)
                            }
                            className="h-4 w-4"
                          />
                          <span className={subtask.isCompleted ? "line-through text-muted-foreground" : ""}>
                            {subtask.title}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(subtask.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}