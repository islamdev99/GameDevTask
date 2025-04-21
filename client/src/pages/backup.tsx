import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UploadCloud, Download, FileInput } from "lucide-react";

export default function Backup() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const { data: lastBackupTime, refetch: refetchBackupTime } = useQuery({
    queryKey: ["lastBackupTime"],
    queryFn: () => {
      const time = localStorage.getItem("lastBackupTime");
      return time ? new Date(time) : null;
    },
  });

  const exportBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/backup");
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Create the JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Create a download link and trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = `gamedev-tasks-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Save the backup time
      const now = new Date();
      localStorage.setItem("lastBackupTime", now.toISOString());
      refetchBackupTime();
      
      toast({
        title: t("backup.title"),
        description: t("backup.backupSuccess"),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export backup",
        variant: "destructive",
      });
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (backupData: any) => {
      return await apiRequest("POST", "/api/restore", backupData);
    },
    onSuccess: () => {
      toast({
        title: t("backup.title"),
        description: t("backup.restoreSuccess"),
      });
      setBackupFile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore from backup",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRestoring(false);
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/json") {
        setBackupFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a valid JSON backup file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/json") {
        setBackupFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a valid JSON backup file",
          variant: "destructive",
        });
      }
    }
  };

  const handleRestore = async () => {
    if (!backupFile) return;
    
    try {
      setIsRestoring(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          await restoreBackupMutation.mutateAsync(backupData);
        } catch (error) {
          toast({
            title: "Error",
            description: "Invalid backup file format",
            variant: "destructive",
          });
          setIsRestoring(false);
        }
      };
      reader.readAsText(backupFile);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read backup file",
        variant: "destructive",
      });
      setIsRestoring(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("backup.title")}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("backup.exportData")}</CardTitle>
            <CardDescription>
              {t("backup.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("backup.lastBackup")}: {lastBackupTime 
                    ? lastBackupTime.toLocaleString() 
                    : t("backup.never")}
                </p>
              </div>
              
              <Button 
                className="w-full bg-primary"
                onClick={() => exportBackupMutation.mutate()}
                disabled={exportBackupMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                {exportBackupMutation.isPending 
                  ? t("app.loading") 
                  : t("backup.exportData")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("backup.importData")}</CardTitle>
            <CardDescription>
              {t("backup.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {backupFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <FileInput className="h-8 w-8 text-primary" />
                  </div>
                  <p>{backupFile.name}</p>
                  <div className="flex space-x-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setBackupFile(null)}
                    >
                      Remove
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-primary">
                          {t("backup.importData")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore from Backup</AlertDialogTitle>
                          <AlertDialogDescription>
                            Restoring from a backup will overwrite all your current data. 
                            This action cannot be undone. Are you sure you want to continue?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-primary"
                            onClick={handleRestore}
                            disabled={isRestoring}
                          >
                            {isRestoring ? t("app.loading") : "Restore"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <UploadCloud className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm">{t("backup.dragAndDrop")}</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("backup.selectFile")}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
