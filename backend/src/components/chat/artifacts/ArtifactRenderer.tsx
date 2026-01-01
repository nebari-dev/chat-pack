import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const ArtifactRenderer = ({ content }: { content: string }) => {
  try {
    const data = JSON.parse(content);
    
    if (data.ui_type === 'calendar') {
        const events = data.data.events || [];
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const hours = [8, 9, 10, 11, 12, 13, 14]; // 8 AM to 2 PM

        // Helper to get day index from ISO string (0=Sun, 1=Mon... but we want 0=Mon for our array)
        const getDayIndex = (isoString: string) => {
            const date = new Date(isoString);
            const day = date.getDay(); // 0=Sun, 1=Mon...
            return day === 0 ? 6 : day - 1; // Shift so Mon=0
        };

        const getHourIndex = (isoString: string) => {
            return new Date(isoString).getHours();
        };

        return (
            <Card className="w-full my-4 border-l-4 border-l-blue-500 shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle>{data.data.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-6 border-b text-sm font-semibold bg-gray-100">
                        <div className="p-2 border-r text-center text-gray-500">Time</div>
                        {days.map(d => <div key={d} className="p-2 border-r text-center">{d}</div>)}
                    </div>
                    <div className="relative">
                        {hours.map(hour => (
                            <div key={hour} className="grid grid-cols-6 border-b min-h-[60px]">
                                <div className="p-2 border-r text-xs text-gray-500 text-right pr-3 -mt-2">
                                    {hour}:00
                                </div>
                                {days.map((_, i) => (
                                    <div key={i} className="border-r relative">
                                        {/* Render events that start in this hour and day */}
                                        {events
                                            .filter((evt: any) => getDayIndex(evt.start) === i && getHourIndex(evt.start) === hour)
                                            .map((evt: any) => (
                                                <div 
                                                    key={evt.id} 
                                                    className="absolute inset-x-1 top-1 bottom-1 bg-blue-100 border-l-4 border-blue-600 rounded p-1 text-xs overflow-hidden shadow-sm hover:z-10 hover:shadow-md transition-shadow cursor-pointer"
                                                    title={`${evt.title}\n${evt.teacher}\n${evt.room}`}
                                                >
                                                    <div className="font-bold truncate text-blue-900">{evt.title}</div>
                                                    <div className="truncate text-blue-800">{evt.room}</div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (data.ui_type === 'chart') {
        const { title, categories, series } = data.data;
        return (
            <Card className="w-full my-4 border-l-4 border-l-green-500 shadow-lg">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    {series && series.length > 0 ? (
                        <div className="h-48 flex items-end justify-around gap-2 p-4 border rounded bg-white">
                            {categories.map((cat: string, cat_idx: number) => (
                                <div key={cat_idx} className="flex flex-col items-center justify-end h-full flex-1 min-w-0 group">
                                    {series.map((s: any, series_idx: number) => (
                                        <div 
                                            key={series_idx} 
                                            className="w-full bg-green-500 rounded-t-sm transition-all duration-300 ease-out hover:opacity-80 relative"
                                            style={{ height: `${s.data[cat_idx] / (Math.max(...series[0].data) || 1) * 80}%`, backgroundColor: `hsl(${140 + series_idx * 40}, 70%, 45%)` }}
                                        > 
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] px-1 rounded z-10">
                                                {s.data[cat_idx]}
                                            </div>
                                        </div>
                                    ))}
                                    <span className="text-xs text-gray-600 mt-2 truncate w-full text-center font-medium">{cat}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No data available for this chart.</p>
                    )}
                </CardContent>
            </Card>
        );
    }
    
    return null; // Not a UI artifact
  } catch (e) {
    return null; // Not JSON
  }
};
