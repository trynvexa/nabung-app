<template>
  <svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <!-- Soft ambient aura -->
      <radialGradient id="aura-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#E8F4E6" stop-opacity="0.95" />
        <stop offset="70%" stop-color="#EEF6EC" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#EEF6EC" stop-opacity="0" />
      </radialGradient>
      <!-- Glass jar subtle tint -->
      <linearGradient id="jar-glass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.85" />
        <stop offset="40%" stop-color="#F2FAF4" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#E1F2E7" stop-opacity="0.75" />
      </linearGradient>
      <!-- Gold coin gradient -->
      <linearGradient id="coin-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDE884" />
        <stop offset="50%" stop-color="#F7CB46" />
        <stop offset="100%" stop-color="#EEB426" />
      </linearGradient>
      <linearGradient id="coin-gold-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F7CE5A" />
        <stop offset="100%" stop-color="#E0A71E" />
      </linearGradient>
      <!-- Leaf green gradient -->
      <linearGradient id="leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#9BC693" />
        <stop offset="100%" stop-color="#5B8758" />
      </linearGradient>
    </defs>

    <!-- Ground Shadow -->
    <ellipse cx="170" cy="275" rx="100" ry="11" fill="#2E4834" fill-opacity="0.1" />

    <!-- 1. Background Botanical Leaves & Sparkles -->
    <!-- Top-Left Leaf -->
    <g class="brand-leaf-float">
      <path
        d="M 52 92 C 34 78 40 50 68 52 C 78 72 70 94 52 92 Z"
        fill="url(#leaf-grad)"
        stroke="#2A4530"
        stroke-width="2.6"
        stroke-linejoin="round"
      />
      <path d="M 44 86 C 56 76 68 64 68 52" stroke="#2A4530" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- Top-Right Leaf -->
    <g class="brand-leaf-float">
      <path
        d="M 285 76 C 305 65 310 92 288 108 C 272 96 270 78 285 76 Z"
        fill="#82AA7E"
        stroke="#2A4530"
        stroke-width="2.6"
        stroke-linejoin="round"
      />
      <path d="M 298 70 C 290 85 284 98 288 108" stroke="#2A4530" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- Mid-Left Leaf -->
    <g>
      <path
        d="M 38 186 C 24 172 32 152 52 156 C 58 174 52 188 38 186 Z"
        fill="#9BC693"
        stroke="#2A4530"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
    </g>

    <!-- Bottom-Right Leaf -->
    <g>
      <path
        d="M 296 220 C 314 212 316 235 298 246 C 286 236 286 224 296 220 Z"
        fill="url(#leaf-grad)"
        stroke="#2A4530"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
    </g>

    <!-- Golden Sparkles (✦) -->
    <!-- Star Top-Left -->
    <path
      d="M 68 132 Q 72 138 78 140 Q 72 142 68 148 Q 66 142 60 140 Q 66 138 68 132 Z"
      fill="#F7C844"
      stroke="#2A4530"
      stroke-width="1.6"
    />
    <!-- Star Top-Right -->
    <path
      d="M 266 52 Q 270 58 276 60 Q 270 62 266 68 Q 264 62 258 60 Q 264 58 266 52 Z"
      fill="#F7C844"
      stroke="#2A4530"
      stroke-width="1.6"
    />
    <!-- Star Mid-Right -->
    <path
      d="M 284 162 Q 287 167 292 168 Q 287 170 284 175 Q 282 170 277 168 Q 282 167 284 162 Z"
      fill="#F7C844"
      stroke="#2A4530"
      stroke-width="1.6"
    />
    <!-- Floating mini sparkle dots -->
    <circle cx="50" cy="62" r="3" fill="#F7C844" />
    <circle cx="298" cy="132" r="2.5" fill="#88AE82" />
    <circle cx="282" cy="192" r="2" fill="#F7C844" />

    <!-- 2. Cat Fluffy Tail (on the right) -->
    <g>
      <path
        d="M 238 228 C 265 220 286 195 284 162 C 282 142 262 140 256 155 C 250 170 262 188 244 205"
        fill="#FFFEFB"
        stroke="#2A4530"
        stroke-width="3.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Tail ginger patch on tip -->
      <path
        d="M 276 150 C 283 148 284 156 284 162 C 282 175 272 182 268 178 C 262 166 265 152 276 150 Z"
        fill="#F2A65A"
      />
    </g>

    <!-- 3. Cat Head & Ears -->
    <g id="cat-mascot">
      <!-- Base Head Fill & Contour -->
      <path
        d="M 112 78
           C 98 42 92 28 92 24
           C 92 20 98 18 104 22
           L 134 52
           C 145 48 157 46 170 46
           C 183 46 195 48 206 52
           L 236 22
           C 242 18 248 20 248 24
           C 248 28 242 42 228 78
           C 246 92 254 112 250 132
           C 245 152 228 162 204 162
           L 136 162
           C 112 162 95 152 90 132
           C 86 112 94 92 112 78 Z"
        fill="#FFFEFB"
        stroke="#2A4530"
        stroke-width="3.8"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- Left Inner Ear (Blush Pink) -->
      <path
        d="M 102 34 L 105 60 L 126 50 Z"
        fill="#F8B6AC"
        stroke="#2A4530"
        stroke-width="2.2"
        stroke-linejoin="round"
      />

      <!-- Calico Ginger/Caramel Patch (Covers right ear and curves onto forehead & cheek) -->
      <path
        d="M 172 46
           C 186 46 196 48 206 52
           L 236 22
           C 242 18 248 20 248 24
           C 248 28 242 42 228 78
           C 246 92 254 112 250 132
           C 248 140 242 147 234 152
           C 226 130 220 102 198 84
           C 184 72 174 62 172 46 Z"
        fill="#F2A65A"
      />

      <!-- Right Inner Ear (Blush Pink inside ginger ear) -->
      <path
        d="M 238 34 L 235 60 L 214 50 Z"
        fill="#F8B6AC"
        stroke="#2A4530"
        stroke-width="2.2"
        stroke-linejoin="round"
      />

      <!-- Cute Happy Smiling Eyes (⌒  ⌒) with subtle outer lash flick -->
      <!-- Left Eye -->
      <path
        d="M 125 104 C 128 96 142 96 145 104"
        stroke="#2A4530"
        stroke-width="3.6"
        stroke-linecap="round"
      />
      <path d="M 125 104 L 120 101" stroke="#2A4530" stroke-width="2.8" stroke-linecap="round" />

      <!-- Right Eye -->
      <path
        d="M 195 104 C 198 96 212 96 215 104"
        stroke="#2A4530"
        stroke-width="3.6"
        stroke-linecap="round"
      />
      <path d="M 215 104 L 220 101" stroke="#2A4530" stroke-width="2.8" stroke-linecap="round" />

      <!-- Rosy Cheeks -->
      <ellipse cx="120" cy="116" rx="12" ry="7" fill="#F8ACA1" fill-opacity="0.82" />
      <ellipse cx="220" cy="116" rx="12" ry="7" fill="#F8ACA1" fill-opacity="0.82" />

      <!-- Cute Tiny Nose -->
      <path
        d="M 166 112 C 168 110 172 110 174 112 L 171 116 C 170.5 117 169.5 117 169 116 Z"
        fill="#DE7F72"
        stroke="#2A4530"
        stroke-width="1.8"
        stroke-linejoin="round"
      />

      <!-- Kawaii Kitten :3 Mouth -->
      <path
        d="M 170 117 V 119
           M 170 119 C 166 125 159 124 155 120
           M 170 119 C 174 125 181 124 185 120"
        stroke="#2A4530"
        stroke-width="2.6"
        stroke-linecap="round"
      />

      <!-- Whisker Lines -->
      <path d="M 100 112 L 80 110" stroke="#2A4530" stroke-width="2" stroke-linecap="round" opacity="0.65" />
      <path d="M 102 120 L 82 123" stroke="#2A4530" stroke-width="2" stroke-linecap="round" opacity="0.65" />
      <path d="M 240 112 L 260 110" stroke="#2A4530" stroke-width="2" stroke-linecap="round" opacity="0.65" />
      <path d="M 238 120 L 258 123" stroke="#2A4530" stroke-width="2" stroke-linecap="round" opacity="0.65" />
    </g>

    <!-- 4. Inside the Savings Jar: Stacked Gold Coins -->
    <g id="jar-coins">
      <!-- Back Coin Left -->
      <circle cx="128" cy="208" r="25" fill="url(#coin-gold-dark)" stroke="#2A4530" stroke-width="3.2" />
      <!-- Back Coin Right -->
      <circle cx="212" cy="208" r="25" fill="url(#coin-gold-dark)" stroke="#2A4530" stroke-width="3.2" />
      <!-- Top Coin behind rim -->
      <circle cx="170" cy="182" r="22" fill="url(#coin-gold)" stroke="#2A4530" stroke-width="3" />

      <!-- Center Big Hero Gold Coin -->
      <circle
        cx="170"
        cy="216"
        r="37"
        fill="url(#coin-gold)"
        stroke="#2A4530"
        stroke-width="3.8"
      />
      <!-- Dotted inner border ring on coin -->
      <circle
        cx="170"
        cy="216"
        r="29"
        fill="none"
        stroke="#FFF7D6"
        stroke-width="2.2"
        stroke-dasharray="3.5 4"
      />
      <!-- "Rp" Symbol -->
      <text
        x="170"
        y="226"
        text-anchor="middle"
        font-family="'Nunito Variable', -apple-system, sans-serif"
        font-weight="900"
        font-size="27"
        fill="#2D5436"
        letter-spacing="-0.5"
      >Rp</text>
    </g>

    <!-- 5. Glass Savings Jar Body & Highlights -->
    <g id="glass-jar">
      <!-- Transparent Jar Main Body -->
      <path
        d="M 104 148
           H 236
           C 256 148 266 162 266 182
           V 234
           C 266 256 250 268 230 268
           H 110
           C 90 268 74 256 74 234
           V 182
           C 74 162 84 148 104 148 Z"
        fill="url(#jar-glass)"
        stroke="#2A4530"
        stroke-width="3.8"
        stroke-linejoin="round"
      />

      <!-- Jar Collar / Lip at the Top -->
      <rect
        x="98"
        y="134"
        width="144"
        height="20"
        rx="10"
        fill="#FFFFFF"
        fill-opacity="0.9"
        stroke="#2A4530"
        stroke-width="3.8"
        stroke-linejoin="round"
      />

      <!-- Glass Reflections -->
      <!-- Left Long Curved Highlight -->
      <path
        d="M 88 174 C 84 198 90 228 100 248"
        stroke="#FFFFFF"
        stroke-width="5"
        stroke-linecap="round"
        opacity="0.85"
      />
      <!-- Left Lip Highlight -->
      <path
        d="M 112 141 H 146"
        stroke="#FFFFFF"
        stroke-width="3.5"
        stroke-linecap="round"
        opacity="0.95"
      />
      <!-- Right Edge Subtle Highlight -->
      <path
        d="M 252 176 C 255 192 254 216 248 232"
        stroke="#FFFFFF"
        stroke-width="3.5"
        stroke-linecap="round"
        opacity="0.65"
      />
    </g>

    <!-- 6. Cat Paws Resting on Jar Rim (Hugging Jar) -->
    <g id="cat-paws">
      <!-- Left Paw -->
      <rect
        x="110"
        y="132"
        width="30"
        height="24"
        rx="12"
        fill="#FFFEFB"
        stroke="#2A4530"
        stroke-width="3.6"
        stroke-linejoin="round"
      />
      <path d="M 120 144 V 151" stroke="#2A4530" stroke-width="2.2" stroke-linecap="round" />
      <path d="M 129 144 V 151" stroke="#2A4530" stroke-width="2.2" stroke-linecap="round" />

      <!-- Right Paw -->
      <rect
        x="200"
        y="132"
        width="30"
        height="24"
        rx="12"
        fill="#FFFEFB"
        stroke="#2A4530"
        stroke-width="3.6"
        stroke-linejoin="round"
      />
      <path d="M 210 144 V 151" stroke="#2A4530" stroke-width="2.2" stroke-linecap="round" />
      <path d="M 219 144 V 151" stroke="#2A4530" stroke-width="2.2" stroke-linecap="round" />
    </g>
  </svg>
</template>
