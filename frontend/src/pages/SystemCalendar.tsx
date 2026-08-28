import React, { useState, useEffect } from "react";
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Filter,
    CheckCircle2, Clock, AlertCircle, Package, FlaskConical, Factory,
    Droplet, Truck, Warehouse, AlertTriangle, Search, Bell, Users, FileText, X,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage"; // Adjust path if needed

const EVENT_TYPES: Record<string, { color: string; icon: React.ElementType; category: string }> = {
    "Batch Approved": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, category: "quality" },
    "Material Received": { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Package, category: "material" },
    "Analysis Started": { color: "bg-purple-50 text-purple-700 border-purple-200", icon: FlaskConical, category: "laboratory" },
    "Production Start": { color: "bg-purple-50 text-purple-700 border-purple-200", icon: Factory, category: "production" },
    "Filling Completed": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Droplet, category: "filling" },
    "QC Check": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle, category: "quality" },
    "Maintenance": { color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle, category: "system" },
    "Batch Created": { color: "bg-blue-50 text-blue-700 border-blue-200", icon: FileText, category: "material" },
    "Lab Analysis": { color: "bg-purple-50 text-purple-700 border-purple-200", icon: FlaskConical, category: "laboratory" },
    "Pending Approval": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, category: "quality" },
    "Rejected Batch": { color: "bg-red-50 text-red-700 border-red-200", icon: X, category: "quality" },
    "Investigation": { color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle, category: "system" },
    "Shipped": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Truck, category: "distribution" },
    "Ready to Ship": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Warehouse, category: "warehouse" },
    "Delivered": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Truck, category: "distribution" },
    "Filling Start": { color: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: Droplet, category: "filling" },
    "QC Completed": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, category: "quality" },
};

const CATEGORIES: Record<string, { label: string; color: string }> = {
    material: { label: "Raw Materials", color: "bg-blue-500" },
    laboratory: { label: "Laboratory", color: "bg-purple-500" },
    production: { label: "Production", color: "bg-indigo-500" },
    filling: { label: "Filling", color: "bg-cyan-500" },
    warehouse: { label: "Warehouse", color: "bg-emerald-500" },
    distribution: { label: "Distribution", color: "bg-teal-500" },
    quality: { label: "Quality", color: "bg-amber-500" },
    system: { label: "System", color: "bg-red-500" },
};

interface Activity {
    id: string;
    type: string;
    batch?: string;
    gas?: string;
    client?: string;
    time: string;
    date: Date;
    performedBy?: string;
}

export default function SystemCalendar() {
    const { t, lang } = useLanguage();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
    const [activeFilter, setActiveFilter] = useState("All Events");
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            try {
                const res = await fetch("http://localhost:5000/api/batches", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const batches = await res.json();
                    const mappedActivities: Activity[] = [];

                    batches.forEach((batch: any) => {
                        if (batch.history && Array.isArray(batch.history)) {
                            batch.history.forEach((h: any, index: number) => {
                                let eventType = "QC Check";
                                if (h.action.includes("Created")) eventType = "Batch Created";
                                else if (h.action.includes("laboratory")) eventType = "Analysis Started";
                                else if (h.action.includes("Lab results")) eventType = "QC Completed";
                                else if (h.action.includes("Rejected")) eventType = "Rejected Batch";
                                else if (h.action.includes("production")) eventType = "Production Start";
                                else if (h.action.includes("distribution")) eventType = "Ready to Ship";

                                const dateObj = new Date(h.timestamp);
                                mappedActivities.push({
                                    id: `${batch._id}-${index}`,
                                    type: eventType,
                                    batch: batch.lotId,
                                    gas: batch.gasId,
                                    client: batch.client,
                                    time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    date: dateObj,
                                    performedBy: h.performedBy,
                                });
                            });
                        }
                    });

                    mappedActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
                    setActivities(mappedActivities);
                }
            } catch (err) {
                console.error("Failed to fetch activities", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const getActivitiesForDate = (date: Date | null) => {
        if (!date) return [];
        return activities.filter(
            (act) =>
                act.date.getDate() === date.getDate() &&
                act.date.getMonth() === date.getMonth() &&
                act.date.getFullYear() === date.getFullYear()
        );
    };

    const getDailyStats = (date: Date) => {
        const dayActivities = getActivitiesForDate(date);
        return {
            total: dayActivities.length,
            completed: dayActivities.filter((a) =>
                a.type.includes("Approved") || a.type.includes("Completed") || a.type.includes("Delivered") || a.type.includes("Ready")
            ).length,
            inProgress: dayActivities.filter((a) =>
                a.type.includes("Start") || a.type.includes("Pending") || a.type.includes("Analysis")
            ).length,
            alerts: dayActivities.filter((a) =>
                a.type.includes("Rejected") || a.type.includes("Maintenance") || a.type.includes("Investigation")
            ).length,
        };
    };

    const navigateMonth = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate);
        if (direction === "prev") {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const isSameDay = (date1: Date, date2: Date) => {
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const days = getDaysInMonth(currentDate);
    const selectedDateActivities = getActivitiesForDate(selectedDate).sort(
        (a, b) => b.date.getTime() - a.date.getTime()
    );
    const stats = getDailyStats(selectedDate);
    const user = JSON.parse(localStorage.getItem("user") || '{"fullName": "Admin", "role": "admin"}');

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">{t("loading_calendar_data")}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col" dir={lang === "ar" ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#00205B] flex items-center justify-center text-white font-bold text-xs">
                        AL
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{t("system_activity_calendar")}</h1>
                        <p className="text-xs text-slate-500">{t("track_all_operations")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t("search_batch_sample")}
                            className="h-10 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                    </div>
                    <button className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            8
                        </span>
                    </button>
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">{user.fullName}</div>
                            <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 grid place-items-center font-bold">
                            {user.fullName.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigateMonth("prev")}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}
                            className="h-8 px-4 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
                        >
                            {t("today")}
                        </button>
                        <button
                            onClick={() => navigateMonth("next")}
                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-900 ml-4">
                            {currentDate.toLocaleDateString(lang === "ar" ? "ar-EG" : lang === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" })}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                            {(["month", "week", "day"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${viewMode === mode
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {t(mode)}
                                </button>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <Download className="h-4 w-4" />
                            {t("export")}
                        </button>
                        <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                            <Filter className="h-4 w-4" />
                            {t("filters")}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                    {/* Calendar Grid */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-slate-200">
                            {[t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")].map((day) => (
                                <div
                                    key={day}
                                    className="px-4 py-3 text-center text-sm font-semibold text-slate-600 border-r border-slate-100 last:border-r-0"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((date, index) => {
                                const dayActivities = getActivitiesForDate(date);
                                const isSelected = date && isSameDay(date, selectedDate);
                                const isToday = date && isSameDay(date, new Date());

                                return (
                                    <div
                                        key={index}
                                        onClick={() => date && setSelectedDate(date)}
                                        className={`min-h-[140px] p-3 border-b border-r border-slate-100 last:border-r-0 cursor-pointer transition-colors ${date ? "hover:bg-slate-50" : "bg-slate-50/50"
                                            } ${isSelected ? "bg-blue-50/50" : ""}`}
                                    >
                                        {date && (
                                            <>
                                                <div className={`text-sm font-medium mb-2 ${isToday ? "w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center" : "text-slate-700"
                                                    }`}>
                                                    {date.getDate()}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayActivities.slice(0, 3).map((act, i) => {
                                                        const eventType = EVENT_TYPES[act.type] || { color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText };
                                                        const Icon = eventType.icon;
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 ${eventType.color}`}
                                                            >
                                                                <Icon className="h-3 w-3" />
                                                                <span className="truncate">{act.type}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayActivities.length > 3 && (
                                                        <div className="text-[10px] text-slate-500 pl-2">
                                                            +{dayActivities.length - 3} {t("more")}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-4">
                            {Object.entries(CATEGORIES).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${value.color}`} />
                                    <span className="text-xs text-slate-600">{value.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    {selectedDate.toLocaleDateString(lang === "ar" ? "ar-EG" : lang === "fr" ? "fr-FR" : "en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedDate(new Date())}
                                className="text-slate-400 hover:text-slate-600"
                                title="Reset to today"
                            >
                                <CalendarIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">{t("daily_summary")}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                    <div className="text-[10px] text-blue-700 mt-0.5">{t("total_events")}</div>
                                </div>
                                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
                                    <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                                    <div className="text-[10px] text-emerald-700 mt-0.5">{t("completed")}</div>
                                </div>
                                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
                                    <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
                                    <div className="text-[10px] text-amber-700 mt-0.5">{t("in_progress")}</div>
                                </div>
                                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
                                    <div className="text-2xl font-bold text-red-600">{stats.alerts}</div>
                                    <div className="text-[10px] text-red-700 mt-0.5">{t("alerts")}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">{t("activity_timeline")}</h4>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {selectedDateActivities.length === 0 ? (
                                    <div className="text-center text-sm text-slate-500 py-8">{t("no_activities_for_date")}</div>
                                ) : (
                                    selectedDateActivities.map((act) => {
                                        const eventType = EVENT_TYPES[act.type] || { color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText, category: "system" };
                                        const Icon = eventType.icon;
                                        const category = CATEGORIES[eventType.category];

                                        return (
                                            <div key={act.id} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-2 h-2 rounded-full ${category?.color || "bg-slate-400"}`} />
                                                    <div className="w-px h-full bg-slate-200 mt-1" />
                                                </div>
                                                <div className="flex-1 pb-3">
                                                    <div className="text-xs text-slate-500 mb-0.5">{act.time}</div>
                                                    <div className="text-sm font-medium text-slate-900">{act.type}</div>
                                                    {act.batch && (
                                                        <div className="text-xs text-slate-600 mt-0.5 font-mono">
                                                            {act.gas} - {act.batch}
                                                        </div>
                                                    )}
                                                    {act.performedBy && (
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {t("by")} {act.performedBy}
                                                        </div>
                                                    )}
                                                    <div className={`text-[10px] mt-1.5 inline-block px-2 py-0.5 rounded-full ${category ? `bg-${category.color.split("-")[1]}-50 text-${category.color.split("-")[1]}-700` : "bg-slate-100 text-slate-700"
                                                        }`}>
                                                        {category?.label || "System"}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">{t("quick_filters")}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[t("all_events"), t("alerts"), t("approvals"), t("material"), t("production"), t("quality")].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${activeFilter === filter
                                            ? "bg-blue-50 border-blue-200 text-blue-700"
                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                                <FileText className="h-4 w-4" />
                                {t("view_traceability_report")}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}