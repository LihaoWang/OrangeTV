import { ArrowLeft } from 'lucide-react';

import { AppIconButton } from './ui/HeroPrimitives';

export function BackButton() {
  return (
    <AppIconButton
      onPress={() => window.history.back()}
      className='a2-icon-button'
      aria-label='Back'
    >
      <ArrowLeft className='w-full h-full' />
    </AppIconButton>
  );
}
