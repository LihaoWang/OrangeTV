import { ArrowLeft } from 'lucide-react';

import { AppIconButton } from './ui/HeroPrimitives';

export function BackButton() {
  return (
    <AppIconButton
      onPress={() => window.history.back()}
      aria-label='Back'
    >
      <ArrowLeft className='h-5 w-5' />
    </AppIconButton>
  );
}
