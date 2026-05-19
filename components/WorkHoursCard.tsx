"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkHoursCardProps {
  activeHours: number;
  isLoading: boolean;
}

export function WorkHoursCard({ activeHours, isLoading }: WorkHoursCardProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getShiftInfo = (date: Date) => {
    const hour = date.getHours();
    // Shift 1: 08:00 - 16:00
    // Shift 2: 16:00 - 00:00
    // Shift 3: 00:00 - 08:00
    
    if (hour >= 8 && hour < 16) {
      return { 
        name: "Shift 1 (Pagi)", 
        start: 8, 
        end: 16, 
        color: "text-blue-500", 
        bgColor: "bg-blue-500/10",
        barColor: "bg-blue-500"
      };
    } else if (hour >= 16 && hour < 24) {
      return { 
        name: "Shift 2 (Sore)", 
        start: 16, 
        end: 24, 
        color: "text-orange-500", 
        bgColor: "bg-orange-500/10",
        barColor: "bg-orange-500"
      };
    } else {
      return { 
        name: "Shift 3 (Malam)", 
        start: 0, 
        end: 8, 
        color: "text-purple-500", 
        bgColor: "bg-purple-500/10",
        barColor: "bg-purple-500"
      };
    }
  };

  const shift = getShiftInfo(now);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Calculate progress relative to current shift (8 hours per shift)
  let elapsedMinutes;
  if (shift.start === 0 && currentHour < 8) {
      // Midnight case for shift 3
      elapsedMinutes = currentHour * 60 + currentMinute;
  } else if (shift.start === 16 && currentHour >= 16) {
      // Afternoon case for shift 2
      elapsedMinutes = (currentHour - 16) * 60 + currentMinute;
  } else {
      // Normal shift
      elapsedMinutes = (currentHour - shift.start) * 60 + currentMinute;
  }
  
  const progress = Math.min(100, Math.max(0, (elapsedMinutes / (8 * 60)) * 100));

  return (
    <Card className="hover:shadow-md transition-shadow col-span-2 md:col-span-1 border-orange-500/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 md:px-6">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
          Jam Kerja Aktif
        </CardTitle>
        <div className={`p-1.5 md:p-2 ${shift.bgColor} rounded-full shrink-0`}>
          <Clock className={`h-3.5 w-3.5 md:h-4 md:w-4 ${shift.color}`} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 md:px-6 space-y-4">
        <div>
          {isLoading ? (
            <div className="h-7 md:h-8 w-14 md:w-16 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold tracking-tight">
                {activeHours}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground font-medium">
                Jam
              </span>
            </div>
          )}
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            Total Bulan Ini
          </p>
        </div>

        <div className="space-y-2 pt-1 border-t border-muted/50 mt-2">
          <div className="flex justify-between items-center text-[10px] md:text-xs">
            <span className={`font-semibold flex items-center gap-1.5 ${shift.color}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${shift.barColor} animate-pulse`} />
              {shift.name}
            </span>
            <span className="text-muted-foreground font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-in-out ${shift.barColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-[9px] text-muted-foreground italic">
              Status: Live
            </p>
            <p className="text-[9px] text-muted-foreground">
              Selesai {shift.end}:00
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
