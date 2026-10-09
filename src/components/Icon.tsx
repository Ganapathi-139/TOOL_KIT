import {
  FileText, QrCode, Image, GraduationCap, Code2, Wrench,
  FilePlus2, Scissors, Minimize2, FileType2, ImageDown,
  FileImage, RotateCw, ListOrdered, Wifi, Contact, ScanLine,
  Expand, RefreshCcw, Calculator, AlignLeft, Braces, Binary,
  Terminal, Timer, ArrowLeftRight, Search, Upload, Download,
  CheckCircle, Shield, Moon, Sun, Menu, X, ChevronRight,
  ArrowUpRight, Plus, Trash2, GripVertical, CalendarCheck,
  Sparkles, Sliders, FileCode, Layers, HardDrive, Gauge, Clock,
  Hash, Fingerprint, Link as LinkIcon, KeyRound, Percent, CaseUpper, Barcode, Volume2,
  type LucideProps,
} from "lucide-react";
import type { ElementType } from "react";

const iconMap: Record<string, ElementType<LucideProps>> = {
  FileText, QrCode, Image, GraduationCap, Code2, Wrench,
  FilePlus2, Scissors, Minimize2, FileType2, ImageDown,
  FileImage, RotateCw, ListOrdered, Wifi, Contact, ScanLine,
  Expand, RefreshCcw, Calculator, AlignLeft, Braces, Binary,
  Terminal, Timer, ArrowLeftRight, Search, Upload, Download,
  CheckCircle, Shield, Moon, Sun, Menu, X, ChevronRight,
  ArrowUpRight, Plus, Trash2, GripVertical, CalendarCheck,
  Sparkles, Sliders, FileCode, Layers, HardDrive, Gauge, Clock,
  Hash, Fingerprint, Link: LinkIcon, KeyRound, Percent, CaseUpper, Barcode, Volume2,
};

interface IconProps extends LucideProps {
  name: string;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = iconMap[name];
  if (!LucideIcon) return null;
  return <LucideIcon {...props} />;
}
