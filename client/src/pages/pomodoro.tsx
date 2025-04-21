import { useEffect } from 'react';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { startTimeTracking, stopTimeTracking } from '@/lib/indexedDb';
import { useI18n } from '@/providers/i18n-provider';

export default function PomodoroPage() {
  const { t } = useI18n();

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('pomodoro.page_title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <PomodoroTimer />
        </div>
        
        <div>
          <div className="bg-card rounded-lg border p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">{t('pomodoro.what_is_pomodoro')}</h2>
            <div className="space-y-4">
              <p>{t('pomodoro.explanation')}</p>
              
              <h3 className="text-lg font-medium">{t('pomodoro.how_to_use')}</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>{t('pomodoro.step1')}</li>
                <li>{t('pomodoro.step2')}</li>
                <li>{t('pomodoro.step3')}</li>
                <li>{t('pomodoro.step4')}</li>
                <li>{t('pomodoro.step5')}</li>
              </ol>
              
              <h3 className="text-lg font-medium">{t('pomodoro.benefits')}</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('pomodoro.benefit1')}</li>
                <li>{t('pomodoro.benefit2')}</li>
                <li>{t('pomodoro.benefit3')}</li>
                <li>{t('pomodoro.benefit4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}