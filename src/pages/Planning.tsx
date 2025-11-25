
import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw, Shield, User, Clock, AlertCircle, MapPin, Printer, CalendarRange, CheckCircle, Lock, Unlock, Calendar, UserCog, X } from 'lucide-react';
import { generateDailySchedule, determineDayType } from '../services/algorithmService';
import { getSchedule, getPersonnel, getGuardPoints, setScheduleStatus, getExceptions, getRoles, saveSchedule } from '../services/storageService';
import { DailySchedule, DayType, Soldier, GuardPoint, ScheduleStatus, RoleDefinition } from '../types';
import { ROTATION_HOURS, SYSTEM_ROLES } from '../constants';
import ConfirmModal from '../components/ConfirmModal';

interface ReplacementTarget {
    type: 'chief' | 'deputy' | 'officer' | 'nco' | 'specialist' | 'guard';
    id?: string;
    index?: number;
    currentSoldierId: string | null;
    roleName: string;
}

const Planning: React.FC = () => {
    const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [schedule, setSchedule] = useState<DailySchedule | null>(null);
    const [personnel, setPersonnel] = useState<Soldier[]>([]);
    const [guardPoints, setGuardPoints] = useState<GuardPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

    const [replacementTarget, setReplacementTarget] = useState<ReplacementTarget | null>(null);
    const [eligibleReplacements, setEligibleReplacements] = useState<Soldier[]>([]);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDangerous: false
    });

    useEffect(() => {
        setPersonnel(getPersonnel());
        setGuardPoints(getGuardPoints());
        loadSchedule(currentDate);
    }, [currentDate]);

    useEffect(() => {
        if (replacementTarget && schedule) {
            findReplacements();
        }
    }, [replacementTarget]);

    const loadSchedule = (date: string) => {
        const s = getSchedule(date);
        setSchedule(s);
    };

    const handleGenerate = () => {
        setLoading(true);
        setTimeout(() => {
            const newSchedule = generateDailySchedule(currentDate);
            setSchedule(newSchedule);
            setLoading(false);
        }, 500);
    };

    const toggleValidation = () => {
        if (!schedule) return;

        const newStatus: ScheduleStatus = schedule.status === 'VALIDATED' ? 'DRAFT' : 'VALIDATED';

        if (newStatus === 'DRAFT') {
            setConfirmModal({
                isOpen: true,
                title: 'Déverrouiller le planning ?',
                message: "Attention : Déverrouiller le planning permet sa modification et sa régénération.\n\nÊtes-vous sûr de vouloir continuer ?",
                isDangerous: true,
                onConfirm: () => executeStatusChange(newStatus)
            });
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Valider le planning ?',
                message: "Ce planning deviendra la version officielle.\nIl ne pourra plus être régénéré accidentellement.",
                isDangerous: false,
                onConfirm: () => executeStatusChange(newStatus)
            });
        }
    };

    const executeStatusChange = (newStatus: ScheduleStatus) => {
        if (!schedule) return;
        setScheduleStatus(schedule.date, newStatus);
        setSchedule({ ...schedule, status: newStatus });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handlePrint = () => {
        window.print();
    };

    const changeDate = (delta: number) => {
        const date = parseISO(currentDate);
        const newDate = addDays(date, delta);
        setCurrentDate(format(newDate, 'yyyy-MM-dd'));
        setSelectedPoint(null);
    };

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            setCurrentDate(e.target.value);
            setSelectedPoint(null);
        }
    };

    const findReplacements = () => {
        if (!replacementTarget || !schedule) return;

        const roles = getRoles();
        const exceptions = getExceptions();
        const date = parseISO(currentDate);

        let requiredRoleKey = '';
        switch (replacementTarget.type) {
            case 'chief': requiredRoleKey = SYSTEM_ROLES.POLICE_CHIEF; break;
            case 'deputy': requiredRoleKey = SYSTEM_ROLES.POLICE_DEPUTY; break;
            case 'officer': requiredRoleKey = SYSTEM_ROLES.PERM_OFFICER; break;
            case 'nco': requiredRoleKey = SYSTEM_ROLES.PERM_NCO; break;
            case 'guard': requiredRoleKey = SYSTEM_ROLES.GUARD; break;
            case 'specialist': break;
        }

        const roleDef = roles.find(r => r.id === requiredRoleKey);
        const allowedRanks = roleDef ? roleDef.allowedRanks : [];

        const busyIds = new Set<string>();
        if (schedule.policeStation.chiefId) busyIds.add(schedule.policeStation.chiefId);
        if (schedule.policeStation.deputyId) busyIds.add(schedule.policeStation.deputyId);
        if (schedule.permanence.officerId) busyIds.add(schedule.permanence.officerId);
        if (schedule.permanence.ncoId) busyIds.add(schedule.permanence.ncoId);
        schedule.specialists.forEach(s => busyIds.add(s.soldierId));
        schedule.guardPoints.forEach(gp => gp.soldiers.forEach(id => busyIds.add(id)));

        if (replacementTarget.currentSoldierId) busyIds.delete(replacementTarget.currentSoldierId);

        const candidates = personnel.filter(p => {
            const hasException = exceptions.some(ex =>
                ex.soldierId === p.id &&
                isWithinInterval(date, { start: parseISO(ex.startDate), end: parseISO(ex.endDate) })
            );
            if (hasException) return false;
            if (busyIds.has(p.id)) return false;
            if (p.exempt) return false;

            if (replacementTarget.type === 'specialist') {
                const requiredSpec = replacementTarget.id;
                return requiredSpec && p.specialties.includes(requiredSpec);
            } else {
                if (!allowedRanks.includes(p.rank)) return false;
                if (replacementTarget.type === 'guard' && p.medicalRestriction) return false;
            }

            return true;
        });

        setEligibleReplacements(candidates);
    };

    const confirmReplacement = (newSoldierId: string) => {
        if (!schedule || !replacementTarget) return;

        const newSchedule = JSON.parse(JSON.stringify(schedule));

        switch (replacementTarget.type) {
            case 'chief': newSchedule.policeStation.chiefId = newSoldierId; break;
            case 'deputy': newSchedule.policeStation.deputyId = newSoldierId; break;
            case 'officer': newSchedule.permanence.officerId = newSoldierId; break;
            case 'nco': newSchedule.permanence.ncoId = newSoldierId; break;
            case 'specialist':
                if (typeof replacementTarget.index === 'number') {
                    newSchedule.specialists[replacementTarget.index].soldierId = newSoldierId;
                }
                break;
            case 'guard':
                if (replacementTarget.id && typeof replacementTarget.index === 'number') {
                    const point = newSchedule.guardPoints.find((gp: any) => gp.pointId === Number(replacementTarget.id));
                    if (point) {
                        point.soldiers[replacementTarget.index] = newSoldierId;
                    }
                }
                break;
        }

        newSchedule.status = 'DRAFT';
        setSchedule(newSchedule);
        saveSchedule(newSchedule);
        setReplacementTarget(null);
    };

    const getSoldierName = (id: string | null, target?: ReplacementTarget) => {
        const isEditable = schedule?.status !== 'VALIDATED' && !!target;

        let content;
        if (!id) {
            content = <span className="text-red-500 italic font-mono print:text-red-700">VACANT</span>;
        } else {
            const s = personnel.find(p => p.id === id);
            content = s ? <span className="font-medium font-mono tracking-tight">{s.rank} {s.lastName} {s.firstName.charAt(0)}.</span> : "Inconnu";
        }

        if (isEditable && target) {
            return (
                <div
                    onClick={(e) => { e.stopPropagation(); setReplacementTarget(target); }}
                    className="group flex items-center justify-between cursor-pointer hover:bg-white/10 p-1 -m-1 rounded transition-colors border border-transparent hover:border-white/20"
                    title="Cliquez pour remplacer"
                >
                    {content}
                    <UserCog className="w-3 h-3 text-military-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            );
        }

        return content;
    };

    const getPointDetails = (id: number) => {
        const point = guardPoints.find(p => p.id === id);
        return point || { id, name: `Point #${id}`, location: '' };
    };

    const dayType = determineDayType(currentDate);
    const isValidated = schedule?.status === 'VALIDATED';

    const getDayColor = (type: DayType) => {
        switch (type) {
            case DayType.Weekend: return "text-orange-400 border-orange-500/30 bg-orange-500/10 print:text-black print:border-black print:bg-transparent";
            case DayType.Ferie: return "text-red-400 border-red-500/30 bg-red-500/10 print:text-black print:border-black print:bg-transparent";
            default: return "text-blue-400 border-blue-500/30 bg-blue-500/10 print:text-black print:border-black print:bg-transparent";
        }
    };

    return (
        <div className="space-y-4 print:space-y-4">

            {/* Print Header */}
            <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-8 text-black">
                <h1 className="text-2xl font-bold uppercase font-sans tracking-wider">Armée de Terre</h1>
                <h2 className="text-xl font-mono">4ème Bataillon de Soutien des Matériels</h2>
                <div className="mt-4 text-lg font-bold uppercase border-2 border-black inline-block px-4 py-1">
                    ORDRE DE SERVICE - {format(parseISO(currentDate), 'dd/MM/yyyy', { locale: fr })}
                </div>
                <div className="text-sm mt-2 uppercase flex justify-center gap-8 font-mono">
                    <span>TYPE: {dayType === DayType.Semaine ? "SEMAINE" : dayType === DayType.Weekend ? "WEEK-END" : "JOUR FÉRIÉ"}</span>
                    <span className="font-bold">STATUT: {schedule?.status === 'VALIDATED' ? "OFFICIEL" : "PROVISOIRE"}</span>
                </div>
            </div>

            {/* Screen Controls */}
            <div className="glass-panel flex flex-col md:flex-row justify-between items-center gap-4 p-4 rounded print:hidden sticky top-0 z-20">
                <div className="flex items-center space-x-2 bg-black/20 p-1 rounded border border-white/5">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="relative group cursor-pointer flex flex-col items-center w-64">
                        <input
                            type="date"
                            value={currentDate}
                            onChange={handleDateInput}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-military-500 font-mono uppercase tracking-widest">Date de service</span>
                            <h2 className="text-lg font-bold text-slate-100 font-mono tracking-tight group-hover:text-military-accent transition-colors">
                                {format(parseISO(currentDate), 'EEEE d MMMM yyyy', { locale: fr }).toUpperCase()}
                            </h2>
                        </div>
                    </div>

                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border backdrop-blur-sm ${getDayColor(dayType)}`}>
                        {dayType === DayType.Semaine ? "SEMAINE" : dayType === DayType.Weekend ? "WEEK-END" : "JOUR FÉRIÉ"}
                    </span>
                    {schedule && (
                        <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border backdrop-blur-sm ${isValidated
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                            }`}>
                            {isValidated ? <Lock className="w-3 h-3 mr-2" /> : <Clock className="w-3 h-3 mr-2" />}
                            {isValidated ? "VALIDÉ" : "BROUILLON"}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    {schedule && (
                        <>
                            <button
                                onClick={toggleValidation}
                                className={`flex items-center px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all border shadow-lg ${isValidated
                                        ? "bg-white/5 text-slate-400 hover:text-white border-white/10 hover:bg-white/10"
                                        : "bg-green-600 hover:bg-green-500 text-white border-green-500 shadow-green-900/20"
                                    }`}
                            >
                                {isValidated ? (
                                    <>
                                        <Unlock className="w-4 h-4 mr-2" />
                                        DÉVERROUILLER
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        VALIDER
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded transition-colors shadow-lg"
                                title="Imprimer l'ordre de service"
                            >
                                <Printer className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

                    {(!schedule || !isValidated) && (
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-military-accent hover:bg-yellow-400 text-black text-xs font-bold uppercase tracking-widest rounded disabled:opacity-50 border border-yellow-600 shadow-lg shadow-yellow-900/20"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            {schedule ? "Régénérer" : "Générer"}
                        </button>
                    )}
                </div>
            </div>

            {schedule ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-4 print:text-black print:block">

                    {/* Left Column: Command & Permanence (Improved UX) */}
                    <div className="space-y-4 lg:space-y-6 lg:sticky lg:top-24 h-fit print:grid print:grid-cols-2 print:gap-4 print:mb-8 print:space-y-0 print:static">

                        {/* Poste de Police */}
                        <div className="glass-panel rounded overflow-hidden print:bg-white print:border-2 print:border-black print:rounded-none shadow-lg border-l-4 border-l-blue-500">
                            <div className="bg-black/20 p-3 border-b border-white/5 flex items-center justify-between print:bg-gray-200 print:border-black">
                                <div className="flex items-center">
                                    <Shield className="w-4 h-4 text-blue-400 mr-2 print:text-black" />
                                    <h3 className="font-bold text-slate-100 text-xs uppercase tracking-widest print:text-black">Poste de Police</h3>
                                </div>
                            </div>
                            <div className="p-3 space-y-2">
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2 p-2 bg-white/5 border border-white/5 rounded hover:bg-white/10 transition-colors print:bg-transparent print:border-b print:border-gray-300 print:rounded-none">
                                    <span className="text-[10px] text-military-500 uppercase font-bold text-right print:text-black">Chef de Poste</span>
                                    <div className="text-slate-200 text-sm font-mono print:text-black">
                                        {getSoldierName(schedule.policeStation.chiefId, { type: 'chief', currentSoldierId: schedule.policeStation.chiefId, roleName: 'Chef de Poste' })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2 p-2 bg-white/5 border border-white/5 rounded hover:bg-white/10 transition-colors print:bg-transparent print:border-b print:border-gray-300 print:rounded-none">
                                    <span className="text-[10px] text-military-500 uppercase font-bold text-right print:text-black">Adjoint</span>
                                    <div className="text-slate-200 text-sm font-mono print:text-black">
                                        {getSoldierName(schedule.policeStation.deputyId, { type: 'deputy', currentSoldierId: schedule.policeStation.deputyId, roleName: 'Adjoint Poste' })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Permanence */}
                        <div className="glass-panel rounded overflow-hidden print:bg-white print:border-2 print:border-black print:rounded-none shadow-lg border-l-4 border-l-purple-500">
                            <div className="bg-black/20 p-3 border-b border-white/5 flex items-center print:bg-gray-200 print:border-black">
                                <User className="w-4 h-4 text-purple-400 mr-2 print:text-black" />
                                <h3 className="font-bold text-slate-100 text-xs uppercase tracking-widest print:text-black">Permanence</h3>
                            </div>
                            <div className="p-3 space-y-2">
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2 p-2 bg-white/5 border border-white/5 rounded hover:bg-white/10 transition-colors print:bg-transparent print:border-b print:border-gray-300 print:rounded-none">
                                    <span className="text-[10px] text-military-500 uppercase font-bold text-right print:text-black">Officier</span>
                                    <div className="text-slate-200 text-sm font-mono print:text-black">
                                        {getSoldierName(schedule.permanence.officerId, { type: 'officer', currentSoldierId: schedule.permanence.officerId, roleName: 'Officier Permanence' })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2 p-2 bg-white/5 border border-white/5 rounded hover:bg-white/10 transition-colors print:bg-transparent print:border-b print:border-gray-300 print:rounded-none">
                                    <span className="text-[10px] text-military-500 uppercase font-bold text-right print:text-black">Sous-Officier</span>
                                    <div className="text-slate-200 text-sm font-mono print:text-black">
                                        {getSoldierName(schedule.permanence.ncoId, { type: 'nco', currentSoldierId: schedule.permanence.ncoId, roleName: 'Adjoint Permanence' })}
                                    </div>
                                </div>

                                <div className="pt-2 mt-2 border-t border-white/10 print:border-black">
                                    <h4 className="text-[10px] text-military-500 uppercase font-bold mb-2 tracking-widest print:text-black pl-2">Spécialistes</h4>
                                    <div className="space-y-1">
                                        {schedule.specialists.length > 0 ? schedule.specialists.map((spec, idx) => (
                                            <div key={idx} className="grid grid-cols-[100px_1fr] items-center gap-2 px-2 py-1 print:border-b print:border-gray-200">
                                                <span className="text-[10px] text-slate-400 uppercase font-bold text-right print:text-black">{spec.specialty}</span>
                                                <div className="text-slate-200 text-sm font-mono print:text-black">
                                                    {getSoldierName(spec.soldierId, {
                                                        type: 'specialist',
                                                        id: spec.specialty,
                                                        index: idx,
                                                        currentSoldierId: spec.soldierId,
                                                        roleName: spec.specialty
                                                    })}
                                                </div>
                                            </div>
                                        )) : <span className="text-xs text-slate-600 italic pl-2">Aucun requis</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Points de Garde */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start print:grid-cols-1 print:gap-4 print:col-span-1 print:block">
                        {schedule.guardPoints.map((point) => {
                            const details = getPointDetails(point.pointId);
                            return (
                                <div key={point.pointId} className="glass-panel rounded overflow-hidden hover:border-white/20 transition-all cursor-pointer group print:bg-white print:border-2 print:border-black print:rounded-none print:break-inside-avoid print:mb-4 shadow-lg" onClick={() => setSelectedPoint(point.pointId)}>
                                    <div className="bg-black/20 p-2 border-b border-white/5 flex justify-between items-center group-hover:bg-white/5 transition-colors print:bg-gray-200 print:border-black">
                                        <div>
                                            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-widest print:text-black">{details.name}</h3>
                                            {details.location && <span className="text-[10px] text-military-500 block font-mono print:text-black">{details.location}</span>}
                                        </div>
                                        <Clock className="w-4 h-4 text-military-600 print:hidden" />
                                    </div>
                                    <div className="p-3">
                                        <div className="space-y-2">
                                            {point.soldiers.map((sid, idx) => (
                                                <div key={idx} className="bg-white/5 p-2 rounded text-sm text-slate-300 border border-white/5 flex justify-between items-center print:bg-transparent print:text-black print:border-black print:border-b print:rounded-none hover:bg-white/10 transition-colors">
                                                    <span className="text-military-600 font-mono text-xs w-6 print:hidden">#{idx + 1}</span>
                                                    <div className="flex-1 text-right">
                                                        {getSoldierName(sid, {
                                                            type: 'guard',
                                                            id: String(point.pointId),
                                                            index: idx,
                                                            currentSoldierId: sid,
                                                            roleName: `Garde - ${details.name}`
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-white/5 text-center print:hidden">
                                            <span className="text-[10px] text-military-500 uppercase font-bold tracking-widest group-hover:text-military-accent transition-colors">Voir Rotations</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {schedule.guardPoints.length === 0 && (
                            <div className="col-span-2 flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded text-slate-500 bg-white/5 print:border-black print:text-black">
                                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm font-mono">PAS DE POINTS DE GARDE ACTIFS</p>
                            </div>
                        )}
                    </div>

                    {/* PRINT-ONLY ROTATION TABLE */}
                    {schedule && (
                        <div className="hidden print:block mt-8 break-before-page col-span-3">
                            <h3 className="text-lg font-bold uppercase text-black mb-4 border-b-2 border-black pb-1 font-mono">
                                Détail des Rotations (24h)
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                {schedule.guardPoints.map((point) => {
                                    const details = getPointDetails(point.pointId);
                                    return (
                                        <div key={point.pointId} className="break-inside-avoid">
                                            <h4 className="font-bold text-sm mb-2 text-black bg-gray-200 px-2 py-1 border border-black inline-block">
                                                {details.name}
                                            </h4>
                                            <table className="w-full text-xs border-collapse border border-black">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-black p-1 text-center w-24 font-mono">HORAIRE</th>
                                                        <th className="border border-black p-1 text-left pl-2">SENTINELLE</th>
                                                        <th className="border border-black p-1 text-center w-32">OBSERVATIONS</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ROTATION_HOURS.map((time, idx) => {
                                                        const nextTime = ROTATION_HOURS[(idx + 1) % ROTATION_HOURS.length];
                                                        const soldierId = point.soldiers[idx % 3];
                                                        const soldier = personnel.find(p => p.id === soldierId);

                                                        return (
                                                            <tr key={time}>
                                                                <td className="border border-black p-1 font-mono text-center">
                                                                    {time} - {nextTime}
                                                                </td>
                                                                <td className="border border-black p-1 font-bold pl-2 uppercase">
                                                                    {soldier ? `${soldier.rank} ${soldier.lastName}` : ""}
                                                                </td>
                                                                <td className="border border-black p-1"></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-16 flex justify-between text-black break-inside-avoid px-8 font-mono text-sm">
                                <div className="text-center">
                                    <p className="font-bold mb-12">L'OFFICIER DE PERMANENCE</p>
                                    <p className="text-xs">Signature</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold mb-12">LE CHEF DE POSTE</p>
                                    <p className="text-xs">Signature</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 glass-panel rounded border-dashed border-white/10 print:hidden">
                    <RefreshCw className="w-12 h-12 text-slate-600 mb-4" />
                    <p className="text-lg text-slate-500 font-mono uppercase">Aucun planning généré</p>
                </div>
            )}

            {/* Rotation Modal Overlay */}
            {selectedPoint && schedule && !replacementTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden backdrop-blur-md">
                    <div className="glass-panel rounded max-w-lg w-full shadow-2xl overflow-hidden border border-white/10">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/30">
                            <div>
                                <h3 className="text-lg font-bold text-slate-100 uppercase tracking-widest">{getPointDetails(selectedPoint).name}</h3>
                                <p className="text-xs text-military-500 font-mono">TABLEAU DES ROTATIONS</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedPoint(null); }} className="text-slate-500 hover:text-white p-2">✕</button>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-white/5">
                                    {ROTATION_HOURS.map((time, idx) => {
                                        const pointData = schedule.guardPoints.find(p => p.pointId === selectedPoint);
                                        const soldierId = pointData?.soldiers[idx % 3];
                                        const soldier = personnel.find(p => p.id === soldierId);
                                        return (
                                            <tr key={time} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3 font-mono text-military-400 bg-black/20 w-1/3 text-center border-r border-white/5">
                                                    {time} - {ROTATION_HOURS[(idx + 1) % 12]}
                                                </td>
                                                <td className="p-3 text-slate-200 font-bold uppercase tracking-wider pl-6">
                                                    {soldier ? `${soldier.rank} ${soldier.lastName}` : "---"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* REPLACEMENT MODAL */}
            {replacementTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden backdrop-blur-md">
                    <div className="glass-panel rounded max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/10">
                        <div className="p-4 border-b border-white/10 bg-black/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Modification de Service</h3>
                                <p className="text-xs text-military-500 font-mono mt-1">{replacementTarget.roleName.toUpperCase()}</p>
                            </div>
                            <button onClick={() => setReplacementTarget(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-4 bg-black/10 border-b border-white/5">
                            <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest">Titulaire Actuel</p>
                            <div className="bg-black/40 p-3 rounded border border-white/10 flex justify-between items-center">
                                {replacementTarget.currentSoldierId ? (
                                    (() => {
                                        const s = personnel.find(p => p.id === replacementTarget.currentSoldierId);
                                        return s ? (
                                            <span className="font-bold text-white font-mono">{s.rank} {s.lastName}</span>
                                        ) : <span>Inconnu</span>;
                                    })()
                                ) : <span className="text-red-500 font-mono text-sm">POSTE VACANT</span>}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-black/20">
                            <p className="text-[10px] text-slate-500 m-2 uppercase font-bold tracking-widest">Remplaçants Disponibles ({eligibleReplacements.length})</p>
                            {eligibleReplacements.length > 0 ? (
                                <div className="grid grid-cols-1 gap-1">
                                    {eligibleReplacements.map(soldier => (
                                        <button
                                            key={soldier.id}
                                            onClick={() => confirmReplacement(soldier.id)}
                                            className="flex items-center justify-between p-3 rounded glass-panel border-transparent hover:border-white/20 hover:bg-white/10 transition-all text-left group"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-300 group-hover:text-white font-mono text-sm uppercase">{soldier.rank} {soldier.lastName}</div>
                                                <div className="text-xs text-slate-600">{soldier.firstName}</div>
                                            </div>
                                            <div className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/30 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                                                Apte
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 text-slate-600 font-mono text-sm border border-dashed border-white/10 m-2">
                                    AUCUN REMPLAÇANT VALIDE
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDangerous={confirmModal.isDangerous}
            />

        </div>
    );
};

export default Planning;
