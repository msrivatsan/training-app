'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Program } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ProgramCard } from '@/components/ProgramCard';
import ProgramBuilder from '@/components/ProgramBuilder';
import { importAllTemplatesForUser, checkTemplatesExist } from '@/lib/import-templates';
import { Plus, Loader2, Download, TrendingUp, User } from 'lucide-react';

export default function ProgramsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [importingTemplates, setImportingTemplates] = useState(false);
  const [templatesExist, setTemplatesExist] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadPrograms();
      checkForTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadPrograms = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Failed to load programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForTemplates = async () => {
    if (!user) return;
    const exists = await checkTemplatesExist(user.id);
    setTemplatesExist(exists);
  };

  const handleImportTemplates = async () => {
    if (!user) return;

    setImportingTemplates(true);
    try {
      const result = await importAllTemplatesForUser(user.id);
      if (result.success) {
        alert(`Successfully imported ${result.imported} program templates!`);
        loadPrograms();
        setTemplatesExist(true);
      } else {
        alert(`Imported ${result.imported} programs. Errors: ${result.errors.join(', ')}`);
        loadPrograms();
      }
    } catch (error) {
      console.error('Failed to import templates:', error);
      alert('Failed to import templates. Please try again.');
    } finally {
      setImportingTemplates(false);
    }
  };

  const handleStartProgram = async (program: Program) => {
    if (!user) return;

    try {
      // Deactivate all other programs
      const { error: deactivateError } = await supabase
        .from('programs')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', program.id);

      if (deactivateError) throw deactivateError;

      // Activate selected program
      const { error: activateError } = await supabase
        .from('programs')
        .update({ is_active: true })
        .eq('id', program.id);

      if (activateError) throw activateError;

      alert(`Started program: ${program.name}`);
      loadPrograms();
    } catch (error) {
      console.error('Failed to start program:', error);
      alert('Failed to start program. Please try again.');
    }
  };

  const handleCustomizeProgram = () => {
    // Navigate to program detail page (to be implemented)
    alert('Program customization coming soon!');
  };

  const handleSaveNewProgram = () => {
    setShowBuilder(false);
    loadPrograms();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (showBuilder) {
    return (
      <ProgramBuilder
        onSave={handleSaveNewProgram}
        onCancel={() => setShowBuilder(false)}
      />
    );
  }

  const templatePrograms = programs.filter(p => p.is_template);
  const userPrograms = programs.filter(p => !p.is_template);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Training Programs</h1>
            <p className="text-gray-400">Choose a pre-built template or create your own</p>
          </div>
          <div className="flex gap-3">
            {!templatesExist && (
              <button
                onClick={handleImportTemplates}
                disabled={importingTemplates}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {importingTemplates ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Import Templates
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setShowBuilder(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Program
            </button>
          </div>
        </div>

        {/* Template Programs */}
        {templatePrograms.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Pre-Built Templates</h2>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                {templatePrograms.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatePrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onStartProgram={handleStartProgram}
                  onCustomize={handleCustomizeProgram}
                />
              ))}
            </div>
          </div>
        )}

        {/* User Programs */}
        {userPrograms.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">My Programs</h2>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
                {userPrograms.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onStartProgram={handleStartProgram}
                  onCustomize={handleCustomizeProgram}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {programs.length === 0 && (
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-16 text-center">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">No Programs Yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Get started by importing pre-built templates or creating your own custom program
            </p>
            <div className="flex gap-4 justify-center">
              {!templatesExist && (
                <button
                  onClick={handleImportTemplates}
                  disabled={importingTemplates}
                  className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {importingTemplates ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Import Templates
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowBuilder(true)}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Program
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
