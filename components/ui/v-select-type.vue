<template>
  <div class="w-32">
    <Listbox v-model="type" v-slot="{ isOpen }">
      <ListboxLabel class="sr-only"> Select an address type: </ListboxLabel>
      <ListboxButton
        class="focus:outline-none border-white"
        :class="isOpen ? '' : 'border-b'"
      >
        <div class="flex justify-center items-center cursor-pointer">
          <span class="mr-3">{{ type }}</span>
          <chevron-down v-if="!isOpen" />
          <chevron-up v-else />
        </div>
      </ListboxButton>
      <ListboxList
        v-show="isOpen"
        class="w-full bg-gray-800 shadow outline-none"
      >
        <ListboxOption
          v-for="type in addressTypes"
          :key="type"
          :value="type"
          v-slot="{ isActive, isSelected }"
        >
          <div
            class="text-left px-3 py-1 cursor-pointer w-full"
            :class="isActive || isSelected ? 'bg-gray-700' : ''"
          >
            {{ type }}
          </div>
        </ListboxOption>
      </ListboxList>
    </Listbox>
  </div>
</template>

<script>
import {
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxList,
  ListboxOption
} from "./ListBox";

export default {
  components: {
    Listbox,
    ListboxLabel,
    ListboxButton,
    ListboxList,
    ListboxOption
  },
  data: () => ({
    addressTypes: ["Residential", "Domicile", "Legal", "Operational"],
    type: "Residential"
  }),
  methods: {
    selectType(type) {
      this.type = type;
      this.show = false;
      this.$emit("update", {
        index: this.index,
        data: { type: this.type, toolTip: `Enter your ${this.type} address` }
      });
    }
  },
  props: {
    index: Number
  },
  watch: {
    type: {
      immediate: true,
      handler(type) {
        this.selectType(type);
      }
    }
  }
};
</script>
