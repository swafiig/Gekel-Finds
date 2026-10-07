import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

const SKIN = '#8A5636';
const SKIN_DARK = '#6B4026';
const HAIR = '#1B120E';
const ORANGE = '#E8590C';
const ORANGE_DARK = '#B53F05';
const GREEN = '#1F8A5B';
const INK = '#2A2321';

/* ───────────────────────── Brand mark ───────────────────────── */
export function LogoMark({ size = 80, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 100 115" fill="none">
      <Path d="M50 6C27 6 10 23 10 46c0 26 40 62 40 62s40-36 40-62C90 23 73 6 50 6Z" stroke={color} strokeWidth={7} strokeLinejoin="round" />
      <Path d="M50 28c-11 0-20 8-20 19 0 14 20 32 20 32s20-18 20-32c0-11-9-19-20-19Z" stroke={color} strokeWidth={6} strokeLinejoin="round" fill={color} fillOpacity={0.3} />
      <Circle cx="50" cy="47" r="7" fill={color} />
    </Svg>
  );
}

/* ───────────────── Slide 1 — "Can't find it? Ask GEKEL." ───────────────── */
export function AskIllustration({ height = 300 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 300 300">
      <Circle cx="150" cy="165" r="125" fill="#F3EADF" />
      {/* hair back */}
      {[[105, 100, 28], [135, 76, 32], [170, 74, 32], [200, 98, 28], [96, 130, 24], [208, 130, 24], [150, 66, 30]].map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill={HAIR} />
      ))}
      {/* neck + body */}
      <Rect x="136" y="170" width="28" height="40" rx="8" fill={SKIN_DARK} />
      <Path d="M58 300 C58 238 92 208 150 208 C208 208 242 238 242 300 Z" fill="#D9500C" />
      {/* face */}
      <Ellipse cx="150" cy="140" rx="40" ry="46" fill={SKIN} />
      {/* fringe curls */}
      {[[118, 104, 17], [138, 96, 19], [162, 96, 19], [182, 104, 17]].map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill={HAIR} />
      ))}
      {/* closed happy eyes + smile */}
      <Path d="M127 138 Q136 145 145 138" stroke="#2A1810" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M155 138 Q164 145 173 138" stroke="#2A1810" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M132 156 Q150 180 168 156 Z" fill="#5A1F1F" />
      <Path d="M138 158 Q150 164 162 158" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Circle cx="124" cy="152" r="5" fill="#C0643C" opacity={0.5} />
      <Circle cx="176" cy="152" r="5" fill="#C0643C" opacity={0.5} />
      {/* box */}
      <Path d="M92 226 L150 210 L208 226 L150 244 Z" fill="#E9B073" />
      <Path d="M92 226 L150 244 L150 300 L92 282 Z" fill="#D08A4D" />
      <Path d="M150 244 L208 226 L208 282 L150 300 Z" fill="#B87238" />
      <Rect x="104" y="262" width="26" height="28" rx="3" fill="#fff" transform="rotate(8 117 276)" />
      <Line x1="109" y1="270" x2="124" y2="272" stroke="#E8590C" strokeWidth={3} />
      <Line x1="109" y1="278" x2="124" y2="280" stroke="#C9C3BA" strokeWidth={2} />
      {/* arms + hands */}
      <Path d="M60 280 C56 242 80 226 98 236 L108 290 Z" fill="#E8590C" />
      <Path d="M240 280 C244 242 220 226 202 236 L192 290 Z" fill="#D9500C" />
      <Circle cx="102" cy="244" r="9" fill={SKIN} />
      <Circle cx="198" cy="244" r="9" fill={SKIN} />
      {/* phone */}
      <G rotation={-12} origin="236, 190">
        <Rect x="216" y="158" width="40" height="66" rx="8" fill={INK} />
        <Rect x="220" y="164" width="32" height="54" rx="5" fill="#fff" />
        <Rect x="224" y="170" width="24" height="7" rx="3" fill={ORANGE} />
        <Rect x="224" y="182" width="24" height="4" rx="2" fill="#D9D3CA" />
        <Rect x="224" y="190" width="18" height="4" rx="2" fill="#D9D3CA" />
        <Rect x="224" y="200" width="24" height="12" rx="4" fill="#FFE5D1" stroke={ORANGE} strokeWidth={1.5} />
      </G>
    </Svg>
  );
}

/* ───────────────────────── Slide 2 — Market stall ───────────────────────── */
export function MarketIllustration({ height = 230 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 320 240">
      <Ellipse cx="160" cy="226" rx="140" ry="10" fill="#EFE7DD" />
      {/* frame */}
      <Rect x="36" y="64" width="248" height="156" fill="#fff" />
      <Rect x="30" y="60" width="8" height="164" fill="#D5CFC6" />
      <Rect x="282" y="60" width="8" height="164" fill="#D5CFC6" />
      {/* awning */}
      <Path d="M24 36 H296 V70 Q276 58 256 70 Q236 82 216 70 Q196 58 176 70 Q156 82 136 70 Q116 58 96 70 Q76 82 56 70 Q38 60 24 70 Z" fill="#D9500C" />
      <Rect x="24" y="30" width="272" height="10" rx="4" fill="#C2410C" />
      {/* shelves left */}
      <Rect x="52" y="92" width="64" height="16" rx="3" fill="#7BD3A6" />
      <Rect x="52" y="114" width="64" height="16" rx="3" fill="#F7A58B" />
      <Rect x="52" y="136" width="64" height="16" rx="3" fill={ORANGE} />
      <Circle cx="106" cy="100" r="2.5" fill={INK} />
      <Circle cx="106" cy="122" r="2.5" fill={INK} />
      <Circle cx="106" cy="144" r="2.5" fill={INK} />
      {/* shelves right */}
      <Rect x="208" y="96" width="64" height="16" rx="3" fill="#E8E2DA" />
      <Rect x="208" y="118" width="64" height="16" rx="3" fill={ORANGE} />
      <Rect x="208" y="140" width="64" height="16" rx="3" fill="#7BD3A6" />
      {/* counters */}
      <Rect x="52" y="176" width="64" height="44" rx="4" fill="#EDE7DF" />
      <Rect x="58" y="184" width="20" height="9" rx="2" fill="#D5CFC6" />
      <Rect x="208" y="176" width="64" height="44" rx="4" fill="#EDE7DF" />
      {/* shopper */}
      <Rect x="146" y="176" width="11" height="44" rx="3" fill={INK} />
      <Rect x="162" y="176" width="11" height="44" rx="3" fill={INK} />
      <Rect x="140" y="124" width="40" height="60" rx="10" fill="#F4F1EC" />
      <Rect x="144" y="130" width="14" height="50" rx="5" fill="#E8590C" />
      <Rect x="162" y="130" width="14" height="50" rx="5" fill="#E8590C" />
      <Rect x="153" y="108" width="14" height="18" rx="5" fill={SKIN_DARK} />
      <Circle cx="160" cy="98" r="15" fill={SKIN} />
      <Path d="M145 94 Q148 80 162 82 Q176 82 175 96 Q168 88 145 94Z" fill={HAIR} />
      {/* phone arm + magnifier arm */}
      <Path d="M142 134 L128 160" stroke="#F4F1EC" strokeWidth={10} strokeLinecap="round" />
      <Rect x="118" y="156" width="14" height="22" rx="3" fill={GREEN} />
      <Path d="M178 134 L196 120" stroke="#F4F1EC" strokeWidth={10} strokeLinecap="round" />
      <Circle cx="210" cy="112" r="14" fill="#fff" fillOpacity={0.6} stroke={ORANGE} strokeWidth={4} />
      <Line x1="200" y1="123" x2="192" y2="132" stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />
      <Line x1="204" y1="112" x2="216" y2="112" stroke={ORANGE} strokeWidth={3} strokeLinecap="round" />
      <Line x1="210" y1="106" x2="210" y2="118" stroke={ORANGE} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/* ───────────────────────── Slide 3 — Tamper-sealed box ───────────────────────── */
export function SealIllustration({ height = 230 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 320 240">
      <Ellipse cx="160" cy="216" rx="110" ry="10" fill="#EADFD2" />
      {/* box faces */}
      <Path d="M62 112 L160 144 L160 214 L62 182 Z" fill="#D8A66E" />
      <Path d="M160 144 L258 112 L258 182 L160 214 Z" fill="#B97F4B" />
      <Path d="M62 112 L160 82 L258 112 L160 144 Z" fill="#A83A06" />
      {/* flaps */}
      <Path d="M62 112 L30 84 L118 62 L160 82 Z" fill="#EBC194" />
      <Path d="M258 112 L290 84 L202 62 L160 82 Z" fill="#DDAA74" />
      {/* tape */}
      <Path d="M153 142 L167 142 L167 212 L153 212 Z" fill={ORANGE} />
      {[150, 160, 170, 180, 190, 200].map((y) => (
        <Line key={y} x1="153" y1={y} x2="167" y2={y} stroke="#FFD1B0" strokeWidth={1.5} strokeDasharray="2 2" />
      ))}
      {/* check seal */}
      <Circle cx="160" cy="168" r="15" fill="#2F9E6E" stroke="#fff" strokeWidth={3} />
      <Path d="M153 168 L158 173 L168 162" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* hands closing flaps */}
      <Path d="M8 70 L52 96 L44 116 L2 92 Z" fill={INK} />
      <Path d="M312 70 L268 96 L276 116 L318 92 Z" fill={INK} />
      <Ellipse cx="56" cy="104" rx="14" ry="9" fill={SKIN} transform="rotate(25 56 104)" />
      <Ellipse cx="264" cy="104" rx="14" ry="9" fill={SKIN} transform="rotate(-25 264 104)" />
      {/* sparkles */}
      <Path d="M46 40 L50 50 L60 54 L50 58 L46 68 L42 58 L32 54 L42 50 Z" fill={ORANGE} />
      <Path d="M286 160 L288 166 L294 168 L288 170 L286 176 L284 170 L278 168 L284 166 Z" fill="#2F9E6E" />
    </Svg>
  );
}

/* ───────────────────────── Slide 4 — Rider + supplier handoff ───────────────────────── */
export function DeliveryIllustration({ height = 230 }: { height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 320 240">
      <Ellipse cx="160" cy="212" rx="140" ry="12" fill="#EFE7DD" />
      {/* bicycle */}
      <Circle cx="62" cy="178" r="28" stroke={INK} strokeWidth={4} fill="none" />
      <Circle cx="136" cy="178" r="28" stroke={INK} strokeWidth={4} fill="none" />
      <Path d="M62 178 L92 140 L136 178 M92 140 L120 140 L136 178 M86 130 L98 130" stroke={ORANGE_DARK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="40" y="108" width="38" height="30" rx="5" fill={ORANGE} />
      {/* rider */}
      <Rect x="100" y="150" width="9" height="34" rx="3" fill={INK} />
      <Rect x="112" y="150" width="9" height="34" rx="3" fill={INK} />
      <Path d="M96 104 Q96 94 108 94 L124 94 Q136 94 136 106 L134 150 L98 150 Z" fill="#D9500C" />
      <Rect x="106" y="82" width="14" height="14" rx="5" fill={SKIN_DARK} />
      <Circle cx="113" cy="74" r="13" fill={SKIN} />
      <Path d="M99 72 Q100 58 114 58 Q128 58 127 72 Z" fill={INK} />
      <Rect x="122" y="66" width="12" height="5" rx="2" fill={INK} />
      <Path d="M134 108 L160 120" stroke="#D9500C" strokeWidth={9} strokeLinecap="round" />
      {/* handoff parcel */}
      <Rect x="158" y="112" width="22" height="18" rx="3" fill="#fff" stroke={ORANGE} strokeWidth={2} />
      <Line x1="158" y1="121" x2="180" y2="121" stroke={ORANGE} strokeWidth={2} />
      {/* supplier */}
      <Rect x="206" y="170" width="10" height="38" rx="3" fill={INK} />
      <Rect x="222" y="170" width="10" height="38" rx="3" fill={INK} />
      <Path d="M198 106 Q198 90 218 90 Q238 90 238 106 L240 176 L196 176 Z" fill={GREEN} />
      <Rect x="211" y="78" width="14" height="14" rx="5" fill={SKIN_DARK} />
      <Circle cx="218" cy="68" r="14" fill={SKIN_DARK} />
      <Path d="M204 66 Q205 52 219 52 Q233 52 232 66 Q222 58 204 66Z" fill={HAIR} />
      <Path d="M200 108 L180 122" stroke={GREEN} strokeWidth={9} strokeLinecap="round" />
      <Path d="M236 112 L250 128" stroke={GREEN} strokeWidth={9} strokeLinecap="round" />
      <Rect x="244" y="118" width="18" height="30" rx="4" fill={INK} />
      <Rect x="247" y="122" width="12" height="22" rx="2" fill="#fff" />
      <Circle cx="253" cy="133" r="5" fill="#2F9E6E" />
      <Path d="M250.5 133 L252.5 135 L256 131" stroke="#fff" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/* ───────────────────────── Product vector art ───────────────────────── */
export type ProductKind = 'sneaker' | 'bag' | 'buds' | 'watch' | 'perfume' | 'hoodie';

export function ProductArt({ kind, size = 80 }: { kind: ProductKind; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {kind === 'sneaker' && (
        <G>
          <Path d="M8 72 H94 V80 Q94 85 88 85 H14 Q8 85 8 80 Z" fill="#fff" stroke="#D5CFC6" strokeWidth={1.5} />
          <Path d="M10 72 L10 50 Q30 50 40 40 L56 52 Q74 56 94 64 V72 Z" fill="#F4F4F4" stroke="#D5CFC6" strokeWidth={1.5} />
          <Path d="M40 40 L56 52 L50 62 L34 52 Z" fill="#E03C31" />
          <Path d="M60 62 Q72 58 86 64" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M24 56 L34 62 M30 52 L40 58" stroke="#B9B2A8" strokeWidth={2} strokeLinecap="round" />
          <Rect x="8" y="76" width="86" height="4" fill="#E03C31" opacity={0.85} />
        </G>
      )}
      {kind === 'bag' && (
        <G>
          <Path d="M34 46 Q34 20 50 20 Q66 20 66 46" stroke="#6E3217" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M18 46 H82 L88 84 Q88 90 82 90 H18 Q12 90 12 84 Z" fill="#9A4B26" />
          <Path d="M18 46 H82 L80 60 Q50 70 20 60 Z" fill="#B3592F" />
          <Circle cx="50" cy="62" r="3.5" fill="#E2B04A" />
          <Path d="M20 76 H80" stroke="#7A3A1C" strokeWidth={1.5} strokeDasharray="3 3" />
        </G>
      )}
      {kind === 'buds' && (
        <G>
          <Rect x="26" y="52" width="48" height="32" rx="14" fill={INK} />
          <Path d="M26 66 H74" stroke="#4A423E" strokeWidth={2} />
          <Circle cx="50" cy="66" r="2.5" fill="#6BE0A0" />
          <Circle cx="38" cy="38" r="9" fill="#3A3330" />
          <Rect x="42" y="38" width="5" height="16" rx="2.5" fill="#3A3330" />
          <Circle cx="62" cy="38" r="9" fill="#3A3330" />
          <Rect x="53" y="38" width="5" height="16" rx="2.5" fill="#3A3330" />
        </G>
      )}
      {kind === 'watch' && (
        <G>
          <Rect x="40" y="6" width="20" height="88" rx="6" fill="#6B4A32" />
          <Circle cx="50" cy="50" r="26" fill="#C9CED6" stroke="#8A9099" strokeWidth={2} />
          <Circle cx="50" cy="50" r="21" fill="#1E3A5F" />
          <Path d="M50 50 L50 36 M50 50 L60 56" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
          {[0, 90, 180, 270].map((a) => (
            <Line key={a} x1="50" y1="31" x2="50" y2="34" stroke="#C9CED6" strokeWidth={2} transform={`rotate(${a} 50 50)`} />
          ))}
          <Rect x="76" y="46" width="5" height="8" rx="2" fill="#8A9099" />
        </G>
      )}
      {kind === 'perfume' && (
        <G>
          <Rect x="42" y="14" width="16" height="16" rx="3" fill="#C9A15B" />
          <Rect x="46" y="28" width="8" height="8" fill="#B8935A" />
          <Rect x="28" y="36" width="44" height="52" rx="10" fill="#F8D7DE" stroke="#E7A9B6" strokeWidth={2} />
          <Rect x="36" y="52" width="28" height="18" rx="3" fill="#fff" />
          <Line x1="40" y1="58" x2="60" y2="58" stroke="#E8590C" strokeWidth={2} />
          <Line x1="40" y1="64" x2="54" y2="64" stroke="#D5CFC6" strokeWidth={2} />
        </G>
      )}
      {kind === 'hoodie' && (
        <G>
          <Path d="M32 22 Q50 12 68 22 L88 38 L80 56 L74 50 L74 88 H26 L26 50 L20 56 L12 38 Z" fill={INK} />
          <Path d="M36 22 Q50 40 64 22 Q50 14 36 22 Z" fill="#3A3330" />
          <Path d="M44 34 L44 50 M56 34 L56 50" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          <Path d="M34 66 H66 L70 82 H30 Z" fill="#3A3330" />
        </G>
      )}
    </Svg>
  );
}
