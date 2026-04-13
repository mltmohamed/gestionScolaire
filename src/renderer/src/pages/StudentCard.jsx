import React, { useState, useRef } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Printer, 
  Download, 
  User, 
  GraduationCap, 
  Calendar,
  Hash,
  Phone,
  MapPin,
  School,
  CreditCard
} from 'lucide-react';
import { APP_LOGO_PNG } from '@/config/appLogo';

export default function StudentCard() {
  const { students, loading } = useStudents();
  const { classes } = useClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const cardRef = useRef(null);

  const filteredStudents = students.filter((student) => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (student.first_name || '').toLowerCase().includes(q) ||
      (student.last_name || '').toLowerCase().includes(q) ||
      (student.matricule || '').toLowerCase().includes(q)
    );
  });

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Non assigné';
  };

  const getAvatar = (student) => {
    if (student.photo) {
      return (
        <img 
          src={student.photo} 
          alt="Photo" 
          className="h-28 w-28 rounded-xl object-cover border-4 border-white shadow-lg"
        />
      );
    }
    
    const color = student.gender === 'F' 
      ? 'text-[#CC0033] bg-[#CC0033]/10' 
      : 'text-[#0066CC] bg-[#0066CC]/10';
    
    return (
      <div className={`h-28 w-28 rounded-xl flex items-center justify-center border-4 border-white shadow-lg ${color}`}>
        <User className="h-14 w-14" />
      </div>
    );
  };

  const handlePrint = () => {
    if (!selectedStudent) return;
    window.print();
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 fade-in pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0066CC] via-[#003399] to-black p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Carte d'Étudiant</h1>
          <p className="text-white/80">Générez et imprimez les cartes d'identité des élèves</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des étudiants */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-black/10 dark:border-white/10">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un élève..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Chargement...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Aucun élève trouvé</div>
            ) : (
              filteredStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    selectedStudent?.id === student.id
                      ? 'bg-gradient-to-r from-[#0066CC] to-[#003399] text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {student.photo ? (
                      <img 
                        src={student.photo} 
                        alt="" 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        student.gender === 'F' ? 'bg-[#CC0033]/20 text-[#CC0033]' : 'bg-[#0066CC]/20 text-[#0066CC]'
                      }`}>
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className={`text-sm ${selectedStudent?.id === student.id ? 'text-white/70' : 'text-slate-500'}`}>
                        {student.matricule || 'Sans matricule'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Aperçu de la carte */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudent ? (
            <>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>

              {/* Carte d'étudiant - Format horizontal */}
              <div 
                ref={cardRef}
                id="student-card"
                className="bg-white rounded-2xl overflow-hidden shadow-2xl mx-auto print:shadow-none"
                style={{ width: '600px', height: '380px' }} // Format horizontal paysage
              >
                <div className="flex h-full">
                  {/* Bande latérale gauche */}
                  <div className="w-16 bg-gradient-to-b from-[#0066CC] via-[#003399] to-black flex flex-col items-center justify-between py-6 text-white">
                    <div className="w-10 h-10 bg-white rounded-lg p-1.5">
                      <img 
                        src={APP_LOGO_PNG} 
                        alt="LA SAGESSE" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs font-bold writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      LA SAGESSE
                    </div>
                    <div className="w-1 h-12 bg-white/30 rounded-full"></div>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 flex">
                    {/* Photo et infos rapides */}
                    <div className="w-48 bg-slate-50 p-6 flex flex-col items-center justify-center border-r border-slate-200">
                      <div className="mb-4">
                        {selectedStudent.photo ? (
                          <img 
                            src={selectedStudent.photo} 
                            alt="Photo" 
                            className="h-32 w-32 rounded-xl object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className={`h-32 w-32 rounded-xl flex items-center justify-center border-4 border-white shadow-lg ${
                            selectedStudent.gender === 'F' ? 'bg-[#CC0033]/10 text-[#CC0033]' : 'bg-[#0066CC]/10 text-[#0066CC]'
                          }`}>
                            <User className="h-16 w-16" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Matricule</p>
                        <p className="text-lg font-bold text-[#0066CC]">
                          {selectedStudent.matricule || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Informations détaillées */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="mb-6">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nom complet</p>
                          <p className="text-2xl font-bold text-slate-900 leading-tight">
                            {selectedStudent.first_name} {selectedStudent.last_name}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Classe</p>
                            <p className="text-base font-semibold text-slate-800 flex items-center gap-2">
                              <School className="h-4 w-4 text-[#0066CC]" />
                              {getClassName(selectedStudent.class_id)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Date de naissance</p>
                            <p className="text-base font-semibold text-slate-800 flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#0066CC]" />
                              {selectedStudent.date_of_birth ? 
                                new Date(selectedStudent.date_of_birth).toLocaleDateString('fr-FR') : 
                                'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Genre</p>
                            <p className="text-base font-semibold text-slate-800">
                              {selectedStudent.gender === 'M' ? 'Masculin' : 
                               selectedStudent.gender === 'F' ? 'Féminin' : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Année scolaire</p>
                            <p className="text-base font-semibold text-slate-800">{currentYear}-{currentYear + 1}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer de la carte */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#0066CC]"></div>
                          <span className="text-xs text-slate-500">Carte d'étudiant officielle</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#0066CC]" />
                          <span className="text-xs font-semibold text-[#0066CC]">{currentYear}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message d'instruction pour impression */}
              <p className="text-center text-sm text-slate-500">
                Cliquez sur "Imprimer" pour imprimer la carte ou enregistrer en PDF.
                <br />
                Dimensions recommandées : 86mm × 54mm (format carte bancaire)
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
              <CreditCard className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sélectionnez un élève pour voir sa carte</p>
            </div>
          )}
        </div>
      </div>

      {/* Styles pour impression */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #student-card,
          #student-card * {
            visibility: visible;
          }
          #student-card {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
            border: 1px solid #e2e8f0;
            width: 600px !important;
            height: 380px !important;
          }
        }
      `}</style>
    </div>
  );
}
