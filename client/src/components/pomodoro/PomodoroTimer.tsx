import { useState, useEffect } from 'react';
import { useTimer } from 'react-timer-hook';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Pause, Play, RotateCcw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/providers/i18n-provider';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

// Default settings for Pomodoro timer
const DEFAULT_SETTINGS = {
  work: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60, // 5 minutes in seconds
  longBreak: 15 * 60, // 15 minutes in seconds
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
};

export function PomodoroTimer() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [showSettings, setShowSettings] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [timeLogId, setTimeLogId] = useState<number | null>(null);

  // Calculate the time to use for the timer based on the current mode
  const getExpiryTimestamp = (seconds: number) => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + seconds);
    return time;
  };

  // Set up the timer
  const {
    seconds,
    minutes,
    hours,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp: getExpiryTimestamp(settings[mode]),
    onExpire: handleTimerComplete,
    autoStart: false,
  });

  // Handle timer completion
  function handleTimerComplete() {
    // Play sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Error playing sound', e));

    // Show notification
    toast({
      title: t('pomodoro.timer_complete'),
      description: mode === 'work' 
        ? t('pomodoro.take_break') 
        : t('pomodoro.back_to_work'),
      duration: 5000,
    });

    // Handle what happens after timer completes based on mode
    if (mode === 'work') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      // Determine if we should take a long break or short break
      const nextMode = newCount % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      
      // Auto start break if setting is enabled
      if (settings.autoStartBreaks) {
        restart(getExpiryTimestamp(settings[nextMode]), true);
      } else {
        restart(getExpiryTimestamp(settings[nextMode]), false);
      }
    } else {
      // Break is over, go back to work
      setMode('work');
      
      // Auto start work if setting is enabled
      if (settings.autoStartPomodoros) {
        restart(getExpiryTimestamp(settings.work), true);
      } else {
        restart(getExpiryTimestamp(settings.work), false);
      }
    }
  }

  // Handle mode change
  function handleModeChange(newMode: PomodoroMode) {
    setMode(newMode);
    restart(getExpiryTimestamp(settings[newMode]), false);
  }

  // Format time for display
  function formatTime(hours: number, minutes: number, seconds: number) {
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Handle settings change
  function updateSettings(key: keyof typeof settings, value: number | boolean) {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('pomodoro.title')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {t('pomodoro.description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {showSettings ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">{t('pomodoro.work_duration')}: {Math.floor(settings.work / 60)} {t('pomodoro.minutes')}</h3>
              <Slider
                value={[settings.work / 60]}
                min={5}
                max={60}
                step={5}
                onValueChange={value => updateSettings('work', value[0] * 60)}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">{t('pomodoro.short_break_duration')}: {Math.floor(settings.shortBreak / 60)} {t('pomodoro.minutes')}</h3>
              <Slider
                value={[settings.shortBreak / 60]}
                min={1}
                max={15}
                step={1}
                onValueChange={value => updateSettings('shortBreak', value[0] * 60)}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">{t('pomodoro.long_break_duration')}: {Math.floor(settings.longBreak / 60)} {t('pomodoro.minutes')}</h3>
              <Slider
                value={[settings.longBreak / 60]}
                min={5}
                max={30}
                step={5}
                onValueChange={value => updateSettings('longBreak', value[0] * 60)}
              />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">{t('pomodoro.long_break_interval')}: {settings.longBreakInterval} {t('pomodoro.pomodoros')}</h3>
              <Slider
                value={[settings.longBreakInterval]}
                min={2}
                max={8}
                step={1}
                onValueChange={value => updateSettings('longBreakInterval', value[0])}
              />
            </div>
            <Button onClick={() => setShowSettings(false)} className="w-full">
              {t('common.save')}
            </Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="work" className="mb-4" value={mode} onValueChange={(value) => handleModeChange(value as PomodoroMode)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="work">{t('pomodoro.work')}</TabsTrigger>
                <TabsTrigger value="shortBreak">{t('pomodoro.short_break')}</TabsTrigger>
                <TabsTrigger value="longBreak">{t('pomodoro.long_break')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-center">
              <div className="text-5xl font-bold mb-6">
                {formatTime(hours, minutes, seconds)}
              </div>
              
              <div className="flex space-x-2 justify-center">
                {!isRunning ? (
                  <Button onClick={start} size="lg">
                    <Play className="mr-2 h-4 w-4" />
                    {t('pomodoro.start')}
                  </Button>
                ) : (
                  <Button onClick={pause} variant="outline" size="lg">
                    <Pause className="mr-2 h-4 w-4" />
                    {t('pomodoro.pause')}
                  </Button>
                )}
                <Button onClick={() => restart(getExpiryTimestamp(settings[mode]), false)} variant="outline" size="icon">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t('pomodoro.completed')}: {pomodoroCount} {t('pomodoro.pomodoros')}
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => toast({
          title: t('pomodoro.tip'),
          description: t('pomodoro.tip_description'),
        })}>
          <Bell className="h-4 w-4 mr-2" /> 
          {t('pomodoro.show_tip')}
        </Button>
      </CardFooter>
    </Card>
  );
}