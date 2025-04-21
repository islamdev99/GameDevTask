import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { createSubtask } from "@/lib/indexedDb";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
});

type SubtaskFormValues = z.infer<typeof schema>;

interface SubtaskFormProps {
  taskId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SubtaskForm({ taskId, onSuccess, onCancel }: SubtaskFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = async (data: SubtaskFormValues) => {
    if (!taskId) return;
    
    setIsSubmitting(true);
    try {
      // Get the highest order for proper positioning
      await createSubtask({
        taskId: taskId,
        title: data.title,
        order: 0, // Will be automatically assigned the next available number
        isCompleted: false
      });
      
      toast({
        title: t("subtasks.title"),
        description: t("subtasks.created"),
      });
      
      form.reset();
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to create subtask:", error);
      toast({
        title: "Error",
        description: "Failed to create subtask",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder={t("subtasks.newSubtask")} 
                      {...field} 
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      {isSubmitting ? t("app.loading") : t("actions.add")}
                    </Button>
                    {onCancel && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={onCancel}
                      >
                        {t("actions.cancel")}
                      </Button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}