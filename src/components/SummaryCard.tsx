export type SummaryCardTone = 'blue' | 'emerald' | 'amber' | 'slate' | 'red';

type SummaryCardProps = {
  label: string;
  value: string;
  tone: SummaryCardTone;
};

const tones: Record<SummaryCardTone, string> = {
  blue: 'bg-blue-50 text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
  red: 'bg-red-50 text-red-700',
};

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, tone }) => (
  <div className={`rounded-2xl p-4 ${tones[tone]}`}>
    <p className="text-sm font-medium opacity-80">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);

export default SummaryCard;
