import React, { useState } from 'react';
import { Ruler, Scale, Thermometer, Zap, BoxSelect, ArrowRightLeft } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

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
        <div className="min-h-screen bg-background pb-20 animate-fade-in">
            <SectionHeader
                title="Universal Unit Converter"
                subtitle="Fast, offline conversions for every standard unit."
            />

            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-surface border border-border rounded-3xl shadow-xl overflow-hidden animate-slide-up">

                    {/* Category Tabs */}
                    <div className="flex overflow-x-auto border-b border-border bg-inset no-scrollbar">
                        {categories.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setCategory(tab.id); setFromUnit(getUnits(tab.id)[0]); setToUnit(getUnits(tab.id)[1]); }}
                                className={`min-w-[80px] flex-1 py-4 flex flex-col items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${category === tab.id ? 'bg-surface text-brand-yellow shadow-inner-lg border-b-2 border-brand-yellow' : 'text-secondary hover:text-primary hover:bg-surface/50'}`}
                            >
                                <tab.icon size={20} className="mb-1" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 space-y-8 bg-surface">
                        {/* Value Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-secondary uppercase tracking-wide">Enter Value</label>
                            <input
                                type="number"
                                value={val}
                                onChange={(e) => setVal(parseFloat(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                className="w-full text-5xl font-light text-primary outline-none bg-transparent border-b border-border focus:border-brand-yellow py-2 transition-colors placeholder:text-secondary/30"
                                placeholder="0"
                            />
                        </div>

                        {/* Dropdowns */}
                        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase">From</label>
                                <div className="relative">
                                    <select
                                        value={fromUnit}
                                        onChange={(e) => setFromUnit(e.target.value)}
                                        className="w-full appearance-none bg-inset border border-border rounded-xl p-3 pr-8 outline-none focus:ring-2 focus:ring-brand-yellow/50 font-medium text-primary cursor-pointer text-sm"
                                    >
                                        {getUnits(category).map(u => <option key={u} value={u}>{getLabel(u)}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="text-secondary pt-6">
                                <ArrowRightLeft size={20} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase">To</label>
                                <div className="relative">
                                    <select
                                        value={toUnit}
                                        onChange={(e) => setToUnit(e.target.value)}
                                        className="w-full appearance-none bg-inset border border-border rounded-xl p-3 pr-8 outline-none focus:ring-2 focus:ring-brand-yellow/50 font-medium text-primary cursor-pointer text-sm"
                                    >
                                        {getUnits(category).map(u => <option key={u} value={u}>{getLabel(u)}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Result Box */}
                        <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-2xl p-8 text-center relative overflow-hidden">
                            <div className="text-sm font-bold text-brand-yellow mb-2 uppercase tracking-wide opacity-80">Converted Result</div>
                            <div className="text-4xl sm:text-5xl font-bold text-primary tracking-tight break-all">
                                {result} <span className="text-xl sm:text-2xl font-normal text-secondary ml-1">{getLabel(toUnit)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Converter;
