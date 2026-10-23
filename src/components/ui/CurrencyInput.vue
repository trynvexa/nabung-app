<script setup lang="ts">
import { ref } from 'vue'
import { formatNumber, parseCurrencyInput } from '@/lib/format'

const props = withDefaults(
  defineProps<{
    id?: string
    placeholder?: string
    large?: boolean
    disabled?: boolean
    invalid?: boolean
    autofocus?: boolean
  }>(),
  {
    placeholder: '0',
    large: false,
    disabled: false,
    invalid: false,
    autofocus: false,
  },
)

const model = defineModel<number>({ default: 0 })
const input = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const display = ref(model.value > 0 ? formatNumber(model.value) : '')

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const amount = parseCurrencyInput(target.value)
  model.value = amount
  display.value = amount > 0 ? formatNumber(amount) : ''
  if (amount > 0) target.value = display.value
}

function onFocus(): void {
  focused.value = true
  if (model.value > 0) display.value = formatNumber(model.value)
  requestAnimationFrame(() => {
    const length = input.value?.value.length ?? 0
    input.value?.setSelectionRange(length, length)
  })
}

function onBlur(): void {
  focused.value = false
  display.value = model.value > 0 ? formatNumber(model.value) : ''
}

defineExpose({
  focus: () => input.value?.focus(),
})
</script>

<template>
  <div class="relative">
    <span
      class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted"
      :class="large ? 'text-base' : 'text-sm'"
    >
      Rp
    </span>
    <input
      :id="props.id"
      ref="input"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :value="display"
      :placeholder="placeholder"
      :disabled="disabled"
      :autofocus="autofocus"
      :aria-invalid="invalid || undefined"
      class="input pl-11 font-extrabold tracking-tight"
      :class="[
        large ? 'h-14 text-2xl' : 'text-base',
        invalid ? 'border-danger focus:border-danger focus:ring-danger/10' : '',
      ]"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
  </div>
</template>
