import React, { useState } from 'react';
import { ArrowLeft, Ruler, Scale, Thermometer, Zap, BoxSelect, ArrowRightLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import { Link } from 'react-router-dom';

type Cat = 'length' | 'weight' | 'temp' | 'speed' | 'area';

const Converter: React.FC = () => {
    const [category, setCategory] = useState<Cat>('length');
    const [val, setVal] = useState<number>(1);
    const [fromUnit, setFromUnit] = useState<string>('m');
    const [toUnit, setToUnit] = useState<string>('ft');

    // Conversion Logic
    const convert = (val: number, from: string, to: string, type: Cat): string => {
        if (isNaN(val)) return '---';

        if (type === 'length') {
            const factors: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, mi: 1609.34, yd: 0.9144 };
            const inMeters = val * factors[from];
            return (inMeters / factors[to]).toPrecision(6).replace(/\.?0+$/, "");
        }
        if (type === 'weight') {
            const factors: Record<string, number> = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 };
            const inKg = val * factors[from];
            return (inKg / factors[to]).toPrecision(6).replace(/\.?0+$/, "");
        }
        if (type === 'speed') {
            // base m/s
            const factors: Record<string, number> = { ms: 1, kmh: 0.277778, mph: 0.44704, kn: 0.514444, fts: 0.3048 };
            const inMs = val * factors[from];
            return (inMs / factors[to]).toPrecision(6).replace(/\.?0+$/, "");
        }
        if (type === 'area') {
            // base sq meter
            const factors: Record<string, number> = { sqm: 1, sqkm: 1e6, sqft: 0.092903, sqmi: 2.59e6, ac: 4046.86, ha: 10000 };
            const inSqm = val * factors[from];
            return (inSqm / factors[to]).toPrecision(6).replace(/\.?0+$/, "");
        }
        if (type === 'temp') {
            if (from === to) return val.toString();
            let c = val;
            if (from === 'f') c = (val - 32) * 5 / 9;
            if (from === 'k') c = val - 273.15;

            if (to === 'c') return c.toFixed(2);
            if (to === 'f') return ((c * 9 / 5) + 32).toFixed(2);
            if (to === 'k') return (c + 273.15).toFixed(2);
        }
        return val.toString();
    };

    const getUnits = (c: Cat) => {
        if (c === 'length') return ['m', 'km', 'cm', 'mm', 'ft', 'in', 'mi', 'yd'];
        if (c === 'weight') return ['kg', 'g', 'mg', 'lb', 'oz', 'ton'];
        if (c === 'speed') return ['ms', 'kmh', 'mph', 'kn', 'fts'];
        if (c === 'area') return ['sqm', 'sqkm', 'sqft', 'sqmi', 'ac', 'ha'];
        if (c === 'temp') return ['c', 'f', 'k'];
        return [];
    };

    const getLabel = (u: string) => {
        const labels: Record<string, string> = {
            m: 'Meters', km: 'Kilometers', cm: 'Centimeters', mm: 'Millimeters', ft: 'Feet', in: 'Inches', mi: 'Miles', yd: 'Yards',
            kg: 'Kilograms', g: 'Grams', mg: 'Milligrams', lb: 'Pounds', oz: 'Ounces', ton: 'Metric Tons',
            ms: 'm/s', kmh: 'km/h', mph: 'mph', kn: 'Knots', fts: 'ft/s',
            sqm: 'm²', sqkm: 'km²', sqft: 'ft²', sqmi: 'mi²', ac: 'Acres', ha: 'Hectares',
            c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin'
        };
        return labels[u] || u.toUpperCase();
    };

    const result = convert(val, fromUnit, toUnit, category);

    const categories: { id: Cat, icon: any, label: string }[] = [
        { id: 'length', icon: Ruler, label: 'Length' },
        { id: 'weight', icon: Scale, label: 'Weight' },
        { id: 'temp', icon: Thermometer, label: 'Temp' },
        { id: 'speed', icon: Zap, label: 'Speed' },
        { id: 'area', icon: BoxSelect, label: 'Area' },
    ];

    return (
        <div className="max-w-xl mx-auto">
            <Link to="/" className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] mb-6 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Link>

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Advanced Converter</h1>
                <p className="text-[var(--text-secondary)]">Fast, offline conversions for standard units.</p>
            </div>

            <Card className="p-0 overflow-hidden border border-[var(--border-color)] shadow-xl shadow-indigo-100 dark:shadow-indigo-900/10">
                <div className="flex overflow-x-auto border-b border-[var(--border-color)] bg-inset no-scrollbar">
                    {categories.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setCategory(tab.id); setFromUnit(getUnits(tab.id)[0]); setToUnit(getUnits(tab.id)[1]); }}
                            className={`min-w-[80px] flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${category === tab.id ? 'bg-[var(--bg-secondary)] text-indigo-600 dark:text-indigo-400 shadow-sm transform scale-105 rounded-t-lg border-t-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <tab.icon size={20} className="mb-1" /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8 space-y-8 bg-[var(--bg-secondary)]/80 backdrop-blur-md">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Enter Value</label>
                        <input
                            type="number"
                            value={val}
                            onChange={(e) => setVal(parseFloat(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="w-full text-3xl sm:text-5xl font-light text-[var(--text-primary)] outline-none bg-transparent border-b border-[var(--border-color)] focus:border-indigo-500 py-2 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder="0"
                        />
                    </div>

                    <div className="flex flex-col sm:grid sm:grid-cols-[1fr,auto,1fr] gap-6 items-center">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">From</label>
                            <div className="relative">
                                <select
                                    value={fromUnit}
                                    onChange={(e) => setFromUnit(e.target.value)}
                                    className="w-full appearance-none bg-inset border border-[var(--border-color)] rounded-xl p-4 pr-8 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 font-medium text-[var(--text-primary)] transition-all cursor-pointer text-sm"
                                >
                                    {getUnits(category).map(u => <option key={u} value={u} className="bg-[var(--bg-secondary)]">{getLabel(u)}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="text-slate-300 dark:text-slate-600 sm:pt-6 flex justify-center">
                            <div className="p-2 rounded-full bg-inset border border-[var(--border-color)] rotate-90 sm:rotate-0">
                                <ArrowRightLeft size={18} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">To</label>
                            <div className="relative">
                                <select
                                    value={toUnit}
                                    onChange={(e) => setToUnit(e.target.value)}
                                    className="w-full appearance-none bg-inset border border-[var(--border-color)] rounded-xl p-4 pr-8 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 font-medium text-[var(--text-primary)] transition-all cursor-pointer text-sm"
                                >
                                    {getUnits(category).map(u => <option key={u} value={u} className="bg-[var(--bg-secondary)]">{getLabel(u)}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white text-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 mt-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-sm font-medium text-indigo-100 mb-2 uppercase tracking-wide">Converted Result</div>
                        <div className="text-3xl sm:text-5xl font-bold tracking-tight break-all">{result} <span className="text-lg sm:text-2xl font-light text-indigo-200 ml-1 sm:ml-2">{getLabel(toUnit)}</span></div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Converter;
