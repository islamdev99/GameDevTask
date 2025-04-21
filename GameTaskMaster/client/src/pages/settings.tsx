import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HexColorPicker } from "react-colorful";

const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  language: z.enum(["en", "ar"]),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Invalid color hex code",
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state for theme management
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState("#6200EA");
  
  // Initialize from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
    
    const savedColor = localStorage.getItem("primaryColor");
    if (savedColor) {
      setPrimaryColor(savedColor);
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  // Apply primary color
  useEffect(() => {
    document.documentElement.style.setProperty("--primary", primaryColor);
    localStorage.setItem("primaryColor", primaryColor);
  }, [primaryColor]);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme,
      language,
      primaryColor,
    },
  });
  
  // Update form when settings change
  useEffect(() => {
    form.reset({
      theme,
      language,
      primaryColor
    });
  }, [theme, language, primaryColor, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SettingsFormValues) => {
      return apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: t("settings.title"),
        description: t("settings.saved"),
      });
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);
    try {
      // Update theme and language immediately
      setTheme(data.theme);
      setLanguage(data.language);
      setPrimaryColor(data.primaryColor);
      
      // Save to backend
      await updateSettingsMutation.mutateAsync(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToDefault = () => {
    form.reset({
      theme: "light",
      language: "en",
      primaryColor: "#6200EA"
    });
    setTheme("light");
    setLanguage("en");
    setPrimaryColor("#6200EA");
    updateSettingsMutation.mutate({
      theme: "light",
      language: "en",
      primaryColor: "#6200EA"
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("settings.title")}</h2>

      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">{t("settings.appearance")}</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.theme")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="light" id="theme-light" />
                              <FormLabel htmlFor="theme-light">
                                {t("settings.themes.light")}
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="dark" id="theme-dark" />
                              <FormLabel htmlFor="theme-dark">
                                {t("settings.themes.dark")}
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.language")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="en" id="lang-en" />
                              <FormLabel htmlFor="lang-en">
                                {t("settings.languages.english")}
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ar" id="lang-ar" />
                              <FormLabel htmlFor="lang-ar">
                                {t("settings.languages.arabic")}
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.colors")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.primaryColor")}</FormLabel>
                        <FormDescription>
                          Choose a primary color for the application
                        </FormDescription>
                        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start mt-2">
                          <HexColorPicker 
                            color={field.value}
                            onChange={field.onChange}
                            style={{ width: '100%', maxWidth: '300px' }}
                          />
                          <div className="flex items-center space-x-2 w-full">
                            <div 
                              className="w-10 h-10 rounded-full border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetToDefault}
                >
                  {t("settings.resetToDefault")}
                </Button>
                <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                  {isSubmitting ? t("app.loading") : t("actions.save")}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
