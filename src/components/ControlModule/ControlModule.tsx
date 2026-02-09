import { Box, Button, Flex, Group, Slider, Stack, Text } from '@mantine/core';
import { useCutUpStore } from '../../store/useCutUpStore';
import { T } from '../../theme/tokens';
import type { Technique } from '../../types/cutup';

const KnobSlider = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) => (
  <Stack align="center" gap={6} style={{ flex: 1, minWidth: 80, maxWidth: 140 }}>
    <Text
      style={{
        fontFamily: T.fontLabel,
        fontSize: '0.55rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: T.labelText,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontFamily: T.fontDisplay,
        fontSize: '1.6rem',
        color: T.amberLed,
        textShadow: '0 0 8px rgba(255,149,0,0.5)',
        lineHeight: 1,
      }}
    >
      {value}
    </Text>
    <Slider
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      label={null}
      style={{ width: '100%' }}
      styles={{
        track: {
          height: 6,
          background: '#1a1a1e',
          borderColor: 'transparent',
        },
        bar: {
          background: `linear-gradient(to right, ${T.amberLed}88, ${T.amberLed})`,
        },
        thumb: {
          width: 18,
          height: 18,
          background: 'radial-gradient(circle at 40% 35%, #666, #3a3a3a 60%, #2a2a2a)',
          border: '2px solid #555',
          boxShadow: '0 0 6px rgba(255,149,0,0.3), 0 2px 4px rgba(0,0,0,0.5)',
        },
        markLabel: {
          fontFamily: T.fontLabel,
          fontSize: '0.5rem',
          color: T.engravedText,
        },
      }}
      marks={[
        { value: min, label: String(min) },
        { value: max, label: String(max) },
      ]}
    />
  </Stack>
);

const synthButtonStyle = {
  root: {
    background: 'linear-gradient(to bottom, #e04000, #c03000)',
    color: '#fff',
    fontFamily: T.fontLabel,
    fontSize: '0.9rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    border: 'none',
    borderRadius: 4,
    padding: '0.75rem 2rem',
    height: 'auto',
    boxShadow: '0 4px 0 #801800, 0 6px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
    transition: 'all 80ms ease',
    '&:active:not([data-disabled])': {
      transform: 'translateY(3px)',
      boxShadow: '0 1px 0 #801800, 0 2px 4px rgba(0,0,0,0.3)',
    },
    '&[data-disabled]': {
      background: 'linear-gradient(to bottom, #e04000, #c03000)',
      opacity: 0.5,
    },
  },
};

const secondaryButtonStyle = {
  root: {
    background: 'linear-gradient(to bottom, #444, #333)',
    color: '#aaa',
    fontFamily: T.fontLabel,
    fontSize: '0.6rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    border: 'none',
    height: 'auto',
    padding: '0.5rem 1rem',
    boxShadow: '0 3px 0 #1a1a1a, 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
    '&:active:not([data-disabled])': {
      transform: 'translateY(2px)',
      boxShadow: '0 1px 0 #1a1a1a, 0 2px 4px rgba(0,0,0,0.2)',
    },
  },
};

const techniqueToggleStyle = (active: boolean) => ({
  root: {
    background: active
      ? 'linear-gradient(to bottom, #444, #333)'
      : 'transparent',
    color: active ? T.amberLed : T.engravedText,
    fontFamily: T.fontLabel,
    fontSize: '0.6rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    border: active ? `1px solid ${T.amberLed}44` : '1px solid #333',
    height: 'auto',
    padding: '0.4rem 0.8rem',
    boxShadow: active
      ? `0 0 8px ${T.amberLed}22, inset 0 1px 0 rgba(255,255,255,0.05)`
      : 'none',
    transition: 'all 150ms ease',
    '&:hover': {
      background: active ? 'linear-gradient(to bottom, #444, #333)' : 'rgba(255,255,255,0.03)',
    },
  },
});

export const ControlModule = () => {
  const technique = useCutUpStore((s) => s.technique);
  const setTechnique = useCutUpStore((s) => s.setTechnique);
  const fragmentSize = useCutUpStore((s) => s.fragmentSize);
  const setFragmentSize = useCutUpStore((s) => s.setFragmentSize);
  const chaosLevel = useCutUpStore((s) => s.chaosLevel);
  const setChaosLevel = useCutUpStore((s) => s.setChaosLevel);
  const foldPosition = useCutUpStore((s) => s.foldPosition);
  const setFoldPosition = useCutUpStore((s) => s.setFoldPosition);
  const lineWidth = useCutUpStore((s) => s.lineWidth);
  const setLineWidth = useCutUpStore((s) => s.setLineWidth);
  const isProcessing = useCutUpStore((s) => s.isProcessing);
  const cut = useCutUpStore((s) => s.cut);
  const reCut = useCutUpStore((s) => s.reCut);
  const outputText = useCutUpStore((s) => s.outputText);

  const techniques: { key: Technique; label: string }[] = [
    { key: 'cutup', label: 'Cut-Up' },
    { key: 'foldin', label: 'Fold-In' },
    { key: 'permutation', label: 'Permute' },
  ];

  return (
    <Stack align="center" gap="md" py={4}>
      {/* Technique Toggle */}
      <Group gap={4} justify="center">
        {techniques.map(({ key, label }) => (
          <Button
            key={key}
            onClick={() => setTechnique(key)}
            styles={techniqueToggleStyle(technique === key)}
          >
            {label}
          </Button>
        ))}
      </Group>

      {/* Parameter Sliders */}
      {technique !== 'permutation' && (
        <Group gap="lg" justify="center" w="100%" wrap="wrap">
          {technique === 'cutup' ? (
            <>
              <KnobSlider label="Fragment" value={fragmentSize} onChange={setFragmentSize} min={1} max={5} step={1} />
              <KnobSlider label="Chaos" value={chaosLevel} onChange={setChaosLevel} min={1} max={10} step={1} />
            </>
          ) : (
            <>
              <KnobSlider label="Width" value={lineWidth} onChange={setLineWidth} min={20} max={120} step={5} />
              <KnobSlider label="Fold" value={foldPosition} onChange={setFoldPosition} min={10} max={90} step={5} />
            </>
          )}
        </Group>
      )}

      <Stack align="center" gap={8}>
        <Flex align="center" gap={6}>
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isProcessing ? T.greenLed : '#333',
              boxShadow: isProcessing ? T.greenGlow : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          <Text
            style={{
              fontFamily: T.fontLabel,
              fontSize: '0.5rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.engravedText,
            }}
          >
            {isProcessing ? 'PROCESSING' : 'READY'}
          </Text>
        </Flex>
        <Button onClick={cut} disabled={isProcessing} styles={synthButtonStyle}>
          {technique === 'cutup' ? '/// CUT ///' : technique === 'foldin' ? '/// FOLD ///' : '/// PERMUTE ///'}
        </Button>
        {outputText && technique !== 'permutation' && (
          <Button onClick={reCut} disabled={isProcessing} styles={secondaryButtonStyle}>
            {technique === 'cutup' ? 'RE-CUT' : 'RE-FOLD'}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
