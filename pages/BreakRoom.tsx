import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Send, Zap, Star, Trophy, RefreshCw, Coffee } from 'lucide-react';
import { subscribeToNotes, addNote, deleteNote } from '../services/storeService';
import { Note } from '../types';
import { interact } from '../services/interactionService';
import { Tooltip } from '../components/Tooltip';

const COLORS = [
  'bg-amber-100 text-amber-900 border-amber-200 rotate-1',
  'bg-rose-100 text-rose-900 border-rose-200 -rotate-1',
  'bg-indigo-100 text-indigo-900 border-indigo-200 rotate-2',
  'bg-emerald-100 text-emerald-900 border-emerald-200 -rotate-2',
  'bg-cyan-100 text-cyan-900 border-cyan-200 rotate-1',
  'bg-violet-100 text-violet-900 border-violet-200 -rotate-1',
];

export const BreakRoom: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  
  // Wheel State
  const [segments, setSegments] = useState<string[]>(['Lunch Break', 'Clean Stock', 'Coffee Run', 'Cashier', 'Free 10m Break']);
  const [newSegment, setNewSegment] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToNotes((data) => {
      setNotes(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    interact();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    await addNote({
      text: newNote,
      date: new Date().toISOString(),
      color
    });
    setNewNote('');
  };

  const handleSpin = () => {
    if (isSpinning || segments.length === 0) return;
    
    interact();
    setIsSpinning(true);
    setWinner(null);
    
    // Random spin: current rotation + min 4 spins + random part
    const newRotation = rotation + 1440 + Math.random() * 360;
    setRotation(newRotation);

    // Calculate winner
    setTimeout(() => {
        setIsSpinning(false);
        const actualRotation = newRotation % 360;
        const segmentAngle = 360 / segments.length;
        // The pointer is usually at top (0deg) or right (90deg).
        // Assuming pointer at top (0deg), and wheel spins clockwise.
        // We need to reverse calculate. 
        // 360 - actualRotation finds the degree relative to 0 at the top.
        const winningIndex = Math.floor(((360 - actualRotation + 90) % 360) / segmentAngle); 
        // Note: The visual alignment might need tweaking depending on CSS transform origin.
        // Simplified Logic: 
        // Let's just pick a random winner visually matching if possible, or just purely functional.
        // Actually, let's map it correctly.
        // Using conic-gradient, the 0deg is top. Rotation moves clockwise.
        // 360 - (rotation % 360) gives the angle at the top.
        const normalizedAngle = (360 - (newRotation % 360)) % 360;
        const index = Math.floor(normalizedAngle / (360 / segments.length));
        
        setWinner(segments[index]);
        // Trigger win sound
        interact();
    }, 4000); // 4s spin duration
  };

  const addSegment = (e: React.FormEvent) => {
      e.preventDefault();
      if(newSegment.trim()) {
          interact();
          setSegments([...segments, newSegment]);
          setNewSegment('');
      }
  };

  const removeSegment = (idx: number) => {
      interact();
      setSegments(segments.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto animate-fade-in flex flex-col">
       <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    The Break Room <Coffee className="text-amber-600" />
                </h2>
                <p className="text-slate-600 font-medium mt-1 text-sm lg:text-base">Relax, coordinate, and spin the wheel!</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 flex-1 min-h-0">
            
            {/* COLUMN 1: THE LUCKY WHEEL */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Zap size={20} className="text-indigo-600" /> Wheel of Destiny
                </h3>

                {/* WHEEL DISPLAY */}
                <div className="relative w-64 h-64 lg:w-80 lg:h-80 mb-8">
                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 text-rose-500 drop-shadow-md">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 12H2L12 2Z" /></svg>
                    </div>

                    <div 
                        className="w-full h-full rounded-full border-4 border-white shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.1, 0, 0.2, 1)"
                        style={{ 
                            transform: `rotate(${rotation}deg)`,
                            background: `conic-gradient(${
                                segments.map((_, i) => {
                                    const percent = 100 / segments.length;
                                    const color = i % 2 === 0 ? '#818cf8' : '#c4b5fd'; // Indigo-400 vs Violet-300
                                    return `${color} ${i * percent}% ${(i + 1) * percent}%`;
                                }).join(', ')
                            })`
                        }}
                    >
                         {/* Labels inside wheel (Simplified) */}
                         {segments.length > 0 && segments.map((seg, i) => {
                             const angle = (360 / segments.length);
                             const rotation = angle * i + (angle / 2);
                             return (
                                 <div 
                                    key={i} 
                                    className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 origin-center flex justify-center pt-4"
                                    style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
                                 >
                                     <span className="text-white font-bold text-xs uppercase tracking-wider drop-shadow-md rotate-180" style={{ writingMode: 'vertical-rl' }}>{seg.substring(0, 15)}</span>
                                 </div>
                             );
                         })}
                    </div>
                    
                    {/* Center Hub */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                        <Star size={20} className="text-amber-400 fill-amber-400" />
                    </div>
                </div>

                {winner && (
                    <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl text-center border-2 border-indigo-100 transform scale-110">
                            <Trophy size={48} className="mx-auto text-amber-500 mb-2 animate-bounce" />
                            <p className="text-sm font-bold text-slate-500 uppercase">The Winner Is</p>
                            <h2 className="text-3xl font-black text-indigo-600 tracking-tight my-2">{winner}</h2>
                            <button onClick={() => setWinner(null)} className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700">OK</button>
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleSpin}
                    disabled={isSpinning || segments.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:transform-none"
                >
                    {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL'}
                </button>

                {/* Edit Segments */}
                <div className="w-full mt-6 pt-6 border-t border-slate-200/50">
                     <p className="text-xs font-bold text-slate-500 uppercase mb-3">Edit Options</p>
                     <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                        {segments.map((seg, i) => (
                            <div key={i} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1 shadow-sm">
                                {seg}
                                <button onClick={() => removeSegment(i)} className="text-slate-400 hover:text-rose-500"><Trash2 size={10} /></button>
                            </div>
                        ))}
                     </div>
                     <form onSubmit={addSegment} className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-white/50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Add option..."
                            value={newSegment}
                            onChange={e => setNewSegment(e.target.value)}
                        />
                        <button type="submit" className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"><Plus size={20} /></button>
                     </form>
                </div>
            </div>

            {/* COLUMN 2: TEAM BOARD */}
            <div className="flex flex-col h-full min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        📌 Shift Board
                     </h3>
                     <span className="text-xs font-bold bg-white/40 px-2 py-1 rounded text-slate-600">{notes.length} Notes</span>
                </div>

                <div className="flex-1 glass-panel rounded-2xl p-4 overflow-y-auto mb-4 bg-slate-100/30 relative">
                     {notes.length === 0 ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-60">
                             <div className="bg-white/50 p-4 rounded-full mb-3">
                                <Star size={32} />
                             </div>
                             <p className="font-medium text-sm">Board is empty</p>
                             <p className="text-xs">Post a note for the team!</p>
                         </div>
                     ) : (
                         <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                            {notes.map(note => (
                                <div key={note.id} className={`break-inside-avoid p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group ${note.color} animate-fade-in`}>
                                    <p className="font-handwriting font-bold text-sm lg:text-base leading-relaxed mb-4 whitespace-pre-wrap">{note.text}</p>
                                    <div className="flex justify-between items-end border-t border-black/5 pt-2">
                                        <span className="text-[10px] font-bold opacity-60 uppercase">{new Date(note.date).toLocaleDateString()}</span>
                                        <button 
                                            onClick={() => { interact(); deleteNote(note.id); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/50 hover:bg-white rounded-md text-rose-600"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                     )}
                </div>

                <form onSubmit={handleAddNote} className="glass-panel p-3 rounded-xl flex items-center gap-3 bg-white/60">
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-500 font-medium"
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                    />
                    <Tooltip content="Post Note" position="top">
                        <button type="submit" disabled={!newNote.trim()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-500/20">
                            <Send size={18} />
                        </button>
                    </Tooltip>
                </form>
            </div>
        </div>
    </div>
  );
};