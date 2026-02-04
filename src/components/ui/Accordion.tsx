'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  type?: 'single' | 'multiple';
  defaultValue?: string[];
}

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

interface AccordionItemContextType {
  value: string;
  isOpen: boolean;
}

import { createContext, useContext } from 'react';

const AccordionContext = createContext<AccordionContextType | null>(null);
const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

export function Accordion({
  children,
  className,
  type = 'single',
  defaultValue = [],
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultValue);

  const toggleItem = (value: string) => {
    if (type === 'single') {
      setOpenItems((prev) => (prev.includes(value) ? [] : [value]));
    } else {
      setOpenItems((prev) =>
        prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('divide-y divide-gray-200', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ children, value, className }: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div className={cn('py-4', className)}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const accordionContext = useContext(AccordionContext);
  const itemContext = useContext(AccordionItemContext);

  if (!accordionContext || !itemContext) {
    throw new Error('AccordionTrigger must be used within AccordionItem');
  }

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between text-left font-medium text-gray-900',
        'hover:text-primary-600 transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg',
        className
      )}
      onClick={() => accordionContext.toggleItem(itemContext.value)}
      aria-expanded={itemContext.isOpen}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-5 w-5 text-gray-500 transition-transform duration-200 shrink-0 ml-4',
          itemContext.isOpen && 'rotate-180'
        )}
        aria-hidden="true"
      />
    </button>
  );
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  const itemContext = useContext(AccordionItemContext);

  if (!itemContext) {
    throw new Error('AccordionContent must be used within AccordionItem');
  }

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-200',
        itemContext.isOpen ? 'mt-4 opacity-100' : 'h-0 opacity-0'
      )}
      aria-hidden={!itemContext.isOpen}
    >
      <div className={cn('text-gray-600', className)}>{children}</div>
    </div>
  );
}
