<template>
  <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
    <!-- Soft ambient background tint -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#F7FAF6] via-[#F4F8F3] to-[#EDF4EC]" />

    <!-- Top-Left Floating Botanical Leaves -->
    <svg
      class="absolute -left-10 -top-8 w-[190px] text-[#7EA67A] opacity-60 sm:w-[230px]"
      viewBox="0 0 200 200"
      fill="none"
    >
      <path d="M 20 20 C 60 70 95 120 120 180" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <!-- Leaf 1 -->
      <path
        d="M 45 42 C 28 35 15 50 25 70 C 45 68 55 55 45 42 Z"
        fill="currentColor"
        fill-opacity="0.55"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 2 -->
      <path
        d="M 62 65 C 80 55 92 70 82 88 C 65 88 55 76 62 65 Z"
        fill="currentColor"
        fill-opacity="0.4"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 3 -->
      <path
        d="M 80 105 C 65 98 55 115 65 132 C 85 130 92 118 80 105 Z"
        fill="currentColor"
        fill-opacity="0.5"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 4 -->
      <path
        d="M 102 135 C 120 125 130 140 122 156 C 105 156 95 145 102 135 Z"
        fill="currentColor"
        fill-opacity="0.35"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>

    <!-- Top-Right Floating Botanical Leaves -->
    <svg
      class="absolute -right-12 -top-6 w-[200px] text-[#7EA67A] opacity-55 sm:w-[240px]"
      viewBox="0 0 200 200"
      fill="none"
    >
      <path d="M 180 20 C 140 70 105 120 80 180" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <!-- Leaf 1 -->
      <path
        d="M 155 42 C 172 35 185 50 175 70 C 155 68 145 55 155 42 Z"
        fill="currentColor"
        fill-opacity="0.5"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 2 -->
      <path
        d="M 138 65 C 120 55 108 70 118 88 C 135 88 145 76 138 65 Z"
        fill="currentColor"
        fill-opacity="0.35"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 3 -->
      <path
        d="M 120 105 C 135 98 145 115 135 132 C 115 130 108 118 120 105 Z"
        fill="currentColor"
        fill-opacity="0.5"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 4 -->
      <path
        d="M 98 135 C 80 125 70 140 78 156 C 95 156 105 145 98 135 Z"
        fill="currentColor"
        fill-opacity="0.35"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>

    <!-- Bottom-Left Floating Botanical Leaves -->
    <svg
      class="absolute -bottom-10 -left-12 w-[210px] text-[#7EA67A] opacity-50 sm:w-[250px]"
      viewBox="0 0 200 200"
      fill="none"
    >
      <path d="M 10 190 C 50 140 90 95 150 70" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <!-- Leaf 1 -->
      <path
        d="M 45 155 C 30 145 25 162 38 178 C 55 174 60 162 45 155 Z"
        fill="currentColor"
        fill-opacity="0.5"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 2 -->
      <path
        d="M 75 130 C 92 120 102 135 92 152 C 75 152 68 140 75 130 Z"
        fill="currentColor"
        fill-opacity="0.35"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 3 -->
      <path
        d="M 110 98 C 98 88 92 105 105 120 C 122 118 126 108 110 98 Z"
        fill="currentColor"
        fill-opacity="0.45"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>

    <!-- Bottom-Right Floating Botanical Leaves -->
    <svg
      class="absolute -bottom-8 -right-10 w-[200px] text-[#7EA67A] opacity-55 sm:w-[240px]"
      viewBox="0 0 200 200"
      fill="none"
    >
      <path d="M 190 190 C 150 140 110 95 50 70" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <!-- Leaf 1 -->
      <path
        d="M 155 155 C 170 145 175 162 162 178 C 145 174 140 162 155 155 Z"
        fill="currentColor"
        fill-opacity="0.5"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 2 -->
      <path
        d="M 125 130 C 108 120 98 135 108 152 C 125 152 132 140 125 130 Z"
        fill="currentColor"
        fill-opacity="0.35"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <!-- Leaf 3 -->
      <path
        d="M 90 98 C 102 88 108 105 95 120 C 78 118 74 108 90 98 Z"
        fill="currentColor"
        fill-opacity="0.45"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </svg>

    <!-- Subtle Golden Sparkles (✦) -->
    <svg class="absolute right-[22%] top-16 w-6 text-[#E5B646] opacity-70" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 Q13 11 22 12 Q13 13 12 22 Q11 13 2 12 Q11 11 12 2 Z" />
    </svg>
    <svg class="absolute left-[16%] top-[34%] w-4 text-[#E5B646] opacity-60" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 Q13 11 22 12 Q13 13 12 22 Q11 13 2 12 Q11 11 12 2 Z" />
    </svg>
    <svg class="absolute right-[14%] bottom-[28%] w-5 text-[#E5B646] opacity-60" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 Q13 11 22 12 Q13 13 12 22 Q11 13 2 12 Q11 11 12 2 Z" />
    </svg>

    <!-- Ambient Glow Dot Accents -->
    <span class="absolute left-[24%] top-[14%] size-1.5 rounded-full bg-[#E5B646]/50" />
    <span class="absolute right-[32%] top-[24%] size-2 rounded-full bg-[#82A87E]/40" />
    <span class="absolute left-[18%] bottom-[20%] size-2 rounded-full bg-[#E5B646]/45" />
    <span class="absolute right-[20%] top-[48%] size-1.5 rounded-full bg-[#82A87E]/35" />
  </div>
</template>
