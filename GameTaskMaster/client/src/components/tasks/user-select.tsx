import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initDemoUser } from "@/lib/indexedDb";

export interface UserSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  includeUnassigned?: boolean;
}

export default function UserSelect({ value, onChange, includeUnassigned = true }: UserSelectProps) {
  const { t } = useLanguage();
  const [initialized, setInitialized] = useState(false);
  
  // Initialize demo user if needed
  useEffect(() => {
    async function init() {
      await initDemoUser();
      setInitialized(true);
    }
    
    init();
  }, []);
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: initialized,
    queryFn: async () => {
      try {
        // Fallback to indexedDB implementation
        const db = await window.indexedDB.open("game-dev-tasks-db", 1);
        return new Promise<User[]>((resolve, reject) => {
          db.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            const transaction = database.transaction(["users"], "readonly");
            const objectStore = transaction.objectStore("users");
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
              resolve(request.result);
            };
            
            request.onerror = () => {
              reject(new Error("Failed to fetch users from IndexedDB"));
            };
          };
          
          db.onerror = () => {
            reject(new Error("Failed to open database"));
          };
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    }
  });
  
  // Get user name by ID
  const getUserById = (id: string | null) => {
    if (!id) return null;
    return users?.find(user => user.id === id);
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Generate random color for avatar
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", 
      "bg-yellow-500", "bg-purple-500", "bg-pink-500",
      "bg-indigo-500", "bg-teal-500"
    ];
    
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };
  
  const selectedUser = getUserById(value);

  return (
    <Select
      value={value || ""}
      onValueChange={(val) => onChange(val === "unassigned" ? null : val)}
      disabled={isLoading || !initialized}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("tasks.unassigned")}>
          {selectedUser ? (
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                {selectedUser.avatar ? (
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                ) : (
                  <AvatarFallback className={getAvatarColor(selectedUser.name)}>
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <span>{selectedUser.name}</span>
            </div>
          ) : (
            <span>{t("tasks.unassigned")}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {includeUnassigned && (
          <SelectItem value="unassigned">
            <span className="text-muted-foreground">{t("tasks.unassigned")}</span>
          </SelectItem>
        )}
        {users?.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback className={getAvatarColor(user.name)}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <span>{user.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}