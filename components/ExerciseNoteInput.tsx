'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ExerciseNote } from '@/lib/types';

interface ExerciseNoteInputProps {
  exerciseLibraryId: string;
  exerciseName: string;
  className?: string;
}

export default function ExerciseNoteInput({
  exerciseLibraryId,
  exerciseName,
  className = '',
}: ExerciseNoteInputProps) {
  const [note, setNote] = useState<ExerciseNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const supabase = createClient();

  // Load existing note
  useEffect(() => {
    async function loadNote() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('exercise_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_library_id', exerciseLibraryId)
        .single();

      if (data) {
        setNote(data as ExerciseNote);
        setNoteText(data.note_text);
        setIsPinned(data.is_pinned);
      }
    }

    loadNote();
  }, [supabase, exerciseLibraryId]);

  // Save note
  const handleSave = async () => {
    if (!noteText.trim()) {
      // Delete note if empty
      if (note) {
        await supabase.from('exercise_notes').delete().eq('id', note.id);
        setNote(null);
      }
      setShowInput(false);
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (note) {
        // Update existing note
        const { data } = await supabase
          .from('exercise_notes')
          .update({
            note_text: noteText,
            is_pinned: isPinned,
          })
          .eq('id', note.id)
          .select()
          .single();

        if (data) {
          setNote(data as ExerciseNote);
        }
      } else {
        // Create new note
        const { data } = await supabase
          .from('exercise_notes')
          .insert({
            user_id: user.id,
            exercise_library_id: exerciseLibraryId,
            note_text: noteText,
            is_pinned: isPinned,
          })
          .select()
          .single();

        if (data) {
          setNote(data as ExerciseNote);
        }
      }

      setIsEditing(false);
      setShowInput(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setNoteText(note?.note_text || '');
    setIsPinned(note?.is_pinned || false);
    setIsEditing(false);
    setShowInput(false);
  };

  if (!showInput && !note) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className={`text-sm text-blue-600 hover:text-blue-700 font-medium ${className}`}
      >
        + Add Note
      </button>
    );
  }

  if (!isEditing && note) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-900">Note for {exerciseName}</span>
              {note.is_pinned && <span className="text-xs">📌</span>}
            </div>
            <p className="text-sm text-blue-800">{note.note_text}</p>
          </div>
          <button
            onClick={() => {
              setIsEditing(true);
              setShowInput(true);
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-3 ${className}`}>
      <label className="block text-xs font-semibold text-gray-700 mb-2">
        Note for {exerciseName}
      </label>
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="e.g., Use thumbless grip, 3-second negative, keep elbows tucked..."
        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={3}
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="rounded"
          />
          <span>Pin note</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
