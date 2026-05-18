import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const Icon = {
  chevL: (p: IconProps = {}) => <svg width="11" height="18" viewBox="0 0 11 18" fill="none" {...p}><path d="M9 1L2 9l7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  chevR: (p: IconProps = {}) => <svg width="11" height="18" viewBox="0 0 11 18" fill="none" {...p}><path d="M2 1l7 8-7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  filter: (p: IconProps = {}) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}><path d="M2 4h14M4 9h10M7 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  plus: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  edit: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  trash: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9.5h5L11 4M7 7v5M9 7v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  close: (p: IconProps = {}) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  user: (p: IconProps = {}) => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...p}><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M3 16c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  clock: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  pin: (p: IconProps = {}) => <svg width="14" height="16" viewBox="0 0 14 16" fill="none" {...p}><path d="M7 1.2c3 0 5.5 2.4 5.5 5.4 0 4-5.5 8.4-5.5 8.4S1.5 10.6 1.5 6.6C1.5 3.6 4 1.2 7 1.2z" stroke="currentColor" strokeWidth="1.5" /><circle cx="7" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  shirt: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M5 2l-3.5 2 1.5 3 2-1v8h6V6l2 1 1.5-3L11 2 9.5 3.5 8 4 6.5 3.5 5 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>,
  handicap: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" r="0.8" fill="currentColor" /></svg>,
  back: (p: IconProps = {}) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  search: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  cal: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M2 6h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>,
  list: (p: IconProps = {}) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M5 3h9M5 8h9M5 13h9M2 3h.5M2 8h.5M2 13h.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
};
