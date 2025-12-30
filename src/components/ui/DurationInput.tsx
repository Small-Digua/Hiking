import { useState, useEffect } from 'react';

interface DurationInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DurationInput({ value, onChange, className }: DurationInputProps) {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  

  // 解析传入的值并设置小时和分钟
  useEffect(() => {
    if (value) {
      // 尝试解析不同格式的时间
      let parsedHours = 0;
      let parsedMinutes = 0;

      // 格式1: "3.5h" 或 "3.5小时" (只匹配小数)
      const decimalMatch = value.match(/(\d+\.\d+)\s*[h小时]/i);
      if (decimalMatch) {
        const totalHours = parseFloat(decimalMatch[1]);
        parsedHours = Math.floor(totalHours);
        parsedMinutes = Math.round((totalHours - parsedHours) * 60);
      }
      // 格式2: "3小时30分钟" - 分别匹配小时和分钟
      else {
        const hoursMatch = value.match(/(\d+)\s*小时/i);
        const minutesMatch = value.match(/(\d+)\s*分钟/i);
        
        if (hoursMatch) parsedHours = parseInt(hoursMatch[1]);
        if (minutesMatch) parsedMinutes = parseInt(minutesMatch[1]);
      }

      setHours(parsedHours > 0 ? parsedHours.toString() : '0');
      setMinutes(parsedMinutes > 0 ? parsedMinutes.toString() : '0');
      
    } else {
      setHours('0');
      setMinutes('0');
      
    }
  }, [value]);

  // 当小时或分钟改变时，更新父组件的值
  const updateValue = (newHours: string, newMinutes: string) => {
    const h = parseInt(newHours) || 0;
    const m = parseInt(newMinutes) || 0;
    
    if (h === 0 && m === 0) {
      onChange('');
    } else {
      let result = '';
      if (h > 0) result += `${h}小时`;
      if (m > 0) result += `${m}分钟`;
      onChange(result);
    }
  };

  const handleHoursFocus = () => {
    if (hours === '0') {
      setHours('');
    }
  };

  const handleMinutesFocus = () => {
    if (minutes === '0') {
      setMinutes('');
    }
  };

  const handleHoursBlur = () => {
    if (hours === '') {
      setHours('0');
    }
  };

  const handleMinutesBlur = () => {
    if (minutes === '') {
      setMinutes('0');
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = e.target.value;
    setHours(newHours);
    updateValue(newHours, minutes);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = e.target.value;
    setMinutes(newMinutes);
    updateValue(hours, newMinutes);
  };

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={hours}
            onChange={handleHoursChange}
            onFocus={handleHoursFocus}
            onBlur={handleHoursBlur}
            className="w-12 px-3 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-center placeholder-black placeholder-opacity-0"
          />
          <span className="text-sm text-slate-600 whitespace-nowrap">小时</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={minutes}
            onChange={handleMinutesChange}
            onFocus={handleMinutesFocus}
            onBlur={handleMinutesBlur}
            className="w-12 px-3 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-sans text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-center placeholder-black placeholder-opacity-0"
          />
          <span className="text-sm text-slate-600 whitespace-nowrap">分钟</span>
        </div>
      </div>
    </div>
  );
}