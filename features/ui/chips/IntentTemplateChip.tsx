import React, { useState } from 'react'
import { Inline, useControlTheme } from 'junoblocks'
import { ChevronDown, Clock } from 'lucide-react'

export function IntentTemplateChip({ label, iconUrl, gradient, onClick, soon = false, disabled = false, description, autoParse = false, selected = false, menuItems, onMenuSelect }: { label: string; iconUrl?: string; gradient: string; onClick?: () => void; soon?: boolean; disabled?: boolean; description?: string; autoParse?: boolean; selected?: boolean; menuItems?: Array<{ id: string; label: string }>; onMenuSelect?: (id: string) => void }) {
  const themeController = useControlTheme();
  const isDark = themeController.theme.name === 'dark';
  const [openMenu, setOpenMenu] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);


  const darkGradient = gradient.includes('#')
    ? gradient.replace(/#[0-9a-fA-F]{6}/g, m => {
      const num = parseInt(m.slice(1), 16);
      let r = Math.floor(((num >> 16) & 0xff) * 0.82);
      let g = Math.floor(((num >> 8) & 0xff) * 0.82);
      let b = Math.floor((num & 0xff) * 0.82);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    })
    : gradient;

  const ChipBody = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '11px',
        color: isDark ? '#f0f2f8' : '#fff',
        borderRadius: '20px',
        fontWeight: 700,
        padding: '0.6em 1.3em',
        margin: '0.3em 0.4em',
        cursor: soon ? 'not-allowed' : 'pointer',
        boxShadow: isDark ? '0 2px 16px 0 rgba(30,40,70,0.18)' : '0 2px 12px 0 rgba(80,80,200,0.10)',
        border: selected ? (isDark ? '1.5px solid #b7c6e7' : ' 1.5px solid #5a6b9a') : 'none',
        transition: 'all 0.12s cubic-bezier(.4,0,.2,1), transform 0.1s ease',
        background: isDark ? darkGradient : gradient,
        transform: 'scale(1)',
        position: 'relative',
        overflow: 'visible',
        opacity: soon || disabled ? 0.5 : 1,
        pointerEvents: soon ? 'none' : 'auto',
        filter: disabled ? 'grayscale(1)' : 'none',
        zIndex: (menuItems && (openMenu || selected)) ? 100 : 20
      }}
      title={description || undefined}
      onClick={() => { if (!menuItems && onClick) { onClick(); } }}
      onMouseEnter={e => {
        // Clear any pending close timeout
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          setCloseTimeout(null);
        }

        if (menuItems) {
          setOpenMenu(true);
        } else {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'
            ; (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
              ? '0 4px 20px 0 rgba(30,40,70,0.25)'
              : '0 4px 16px 0 rgba(80,80,200,0.15)'
        }
      }}
      onMouseLeave={e => {
        if (menuItems) {
          // Set a timeout before closing the menu
          const timeout = setTimeout(() => {
            if (!selected) setOpenMenu(false);
          }, 200); // 200ms delay before closing
          setCloseTimeout(timeout);
        } else {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
            ; (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
              ? '0 2px 16px 0 rgba(30,40,70,0.18)'
              : '0 2px 12px 0 rgba(80,80,200,0.10)'
        }
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
          ? '0 2px 16px 0 rgba(30,40,70,0.18)'
          : '0 2px 12px 0 rgba(80,80,200,0.10)';
      }}
    >
      {soon && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: '0.7em',
          padding: '0.2em 0.6em',
          borderBottomLeftRadius: '8px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          transform: 'translateY(-100%)',
          animation: 'slideDown 0.2s ease-out forwards',
        }}>
          SOON
        </div>
      )}
      <Inline>
        {iconUrl && <img src={iconUrl} alt="Icon" style={{
          marginRight: '0.7em',
          height: '2em',
          borderRadius: '50%',
          background: isDark ? 'rgba(80,90,120,0.18)' : 'rgba(255,255,255,0.2)',
          filter: soon ? 'grayscale(0.8)' : 'none',
          opacity: soon ? 0.8 : 1
        }} />}
        <span style={{
          fontWeight: 700,
          fontSize: '1.1em',
          letterSpacing: 1,
          opacity: soon ? 0.8 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.3em'
        }}>
          {label}
          {menuItems && menuItems.length > 0 && (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: 6 }}
              aria-label={`Open menu for ${label}`}
            >
              <ChevronDown size={14} />
            </span>
          )}
          {autoParse && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 8,
                padding: '2px 6px',
                borderRadius: 10,
                background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)',
                fontSize: 10,
                fontWeight: 700
              }}
            >
              ✨ auto
            </span>
          )}
          {soon && <><Clock size={14} style={{ marginLeft: '0.2em' }} /> <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '0.7em',
            padding: '0.2em 0.6em',
            borderBottomLeftRadius: '8px',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}>
            SOON
          </div></>}
          {disabled && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '0.7em',
              padding: '0.2em 0.6em',
              borderBottomLeftRadius: '8px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              CURRENTLY NOT AVAILABLE
            </div>
          )}
        </span>
      </Inline>
      {(menuItems && menuItems.length > 0 && (openMenu || selected)) && (
        <div
          style={{
            position: 'absolute',
            right: 8,
            top: '100%',
            marginTop: 6,
            minWidth: 180,
            borderRadius: 8,
            background: isDark ? '#1f2330' : '#ffffff',
            boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.35)' : '0 6px 20px rgba(0,0,0,0.12)',
            border: isDark ? '1px solid #2b2f3d' : '1px solid #e6eaf3',
            zIndex: 1000000,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            // Clear any pending close timeout when re-entering the menu
            if (closeTimeout) {
              clearTimeout(closeTimeout);
              setCloseTimeout(null);
            }
            setOpenMenu(true);
          }}
          onMouseLeave={() => {
            // Set a timeout before closing the menu
            const timeout = setTimeout(() => {
              if (!selected) setOpenMenu(false);
            }, 200); // 200ms delay before closing
            setCloseTimeout(timeout);
          }}
        >
          {menuItems.map((mi) => {
            const isSelected = selected && selectedId === mi.id;
            return (
              <div
                key={mi.id}
                className={isSelected ? 'selected-menu-item' : ''}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(mi.id);
                  onMenuSelect?.(mi.id);
                  // Keep the menu open to show the selection
                  setOpenMenu(true);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isDark ? '#e1e5f0' : '#2d3748',
                  background: isSelected
                    ? (isDark ? 'rgba(94, 94, 178, 0.2)' : 'rgba(94, 94, 178, 0.1)')
                    : 'transparent',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget;
                  target.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget;
                  if (!isSelected) {
                    target.style.backgroundColor = 'transparent';
                  } else {
                    target.style.backgroundColor = isDark ? 'rgba(94, 94, 178, 0.2)' : 'rgba(94, 94, 178, 0.1)';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  <span>{mi.label}</span>
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
                    </svg>
                  )}
                </div>


              </div>
            )
          })}
        </div>
      )}
    </div>
  );

  // Clean up any pending timeouts when component unmounts
  React.useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  return (
    <div style={{ display: "inline-block", maxWidth: "100%" }}>{ChipBody}</div>
  );
}
