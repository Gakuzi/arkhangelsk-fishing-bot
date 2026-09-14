import React, { useState } from 'react';
import { Users, Flame, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { CrewMember } from '../types.ts';

interface CrewRosterProps {
  crew: CrewMember[];
  onVoteRecorded: () => void;
}

export const CrewRoster: React.FC<CrewRosterProps> = ({ crew, onVoteRecorded }) => {
  const [userName, setUserName] = useState('Дмитрий');
  const [isVoting, setIsVoting] = useState(false);
  const [voteResponse, setVoteResponse] = useState<string | null>(null);

  const goingCount = crew.filter(c => c.vote === 'yes').length;
  const notGoingCount = crew.filter(c => c.vote === 'no').length;

  const handleVote = async (action: 'vote_yes' | 'vote_no') => {
    if (!userName.trim() || isVoting) return;

    setIsVoting(true);
    setVoteResponse(null);

    try {
      const res = await fetch('/api/crew/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userName, action })
      });
      const data = await res.json();
      if (data.reply) {
        setVoteResponse(data.reply);
      }
      onVoteRecorded();
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Экипаж Выезда</h2>
            <p className="text-xs text-slate-400">Сбор участников (обработка vote_yes / vote_no)</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-medium">
            🔥 Идут: {goingCount}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 font-medium">
            🫡 Отказ: {notGoingCount}
          </span>
        </div>
      </div>

      {voteResponse && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div dangerouslySetInnerHTML={{ __html: voteResponse }} />
        </div>
      )}

      {/* Crew Members List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2 max-h-56 pr-1">
        {crew.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">Пока нет проголосовавших</div>
        ) : (
          crew.map(member => (
            <div
              key={member.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                member.vote === 'yes'
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                  : 'bg-rose-950/20 border-rose-900/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {member.vote === 'yes' ? (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                    <UserX className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm text-slate-100">{member.user}</div>
                  <div className="text-[11px] text-slate-400">
                    {member.vote === 'yes' ? '🔥 В экипаже на выезд' : '🫡 Отказ от выезда'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{member.timestamp}</span>
            </div>
          ))
        )}
      </div>

      {/* Interactive Vote Form */}
      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">Принять участие в голосовании:</span>
        </div>

        <input
          type="text"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleVote('vote_yes')}
            disabled={isVoting || !userName.trim()}
            className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-950"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>🔥 Я в экипаже!</span>
          </button>

          <button
            onClick={() => handleVote('vote_no')}
            disabled={isVoting || !userName.trim()}
            className="py-2 px-3 rounded-lg bg-rose-900/80 hover:bg-rose-800 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-1.5 transition"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>🫡 Пропускаю</span>
          </button>
        </div>
      </div>
    </div>
  );
};
