<template>
  <div class="flex h-full">
    <div class="hidden map"></div>
    <div class="group mt-4">
      <button
        class="h-4 w-4 text-white border border-white rounded-full flex items-center justify-center cursor-pointer text-xs capitalize focus:outline-none"
        @focus="toolTipFocus = true"
        @blur="toolTipFocus = false"
      >
        ?
      </button>
      <span
        class="hidden group-hover:flex rounded absolute right-1/2 text-xs text-white bg-gray-900 shadow py-1 px-2"
        :class="toolTipFocus ? 'w-24' : ''"
        >{{ toolTip }}</span
      >
    </div>
    <div class="flex">
      <div class="text-white flex flex-col">
        <input
          type="text"
          placeholder="Address"
          class="focus:outline-none bg-transparent border-b border-white w-56 px-1"
          :id="`address-${index}`"
          v-model="addressText"
          autocomplete="off"
          @input="search()"
          @focus="addressInputFocused()"
          @blur="addressFocus = false"
          @keyup.down="focusOnListBox()"
        />
        <label
          :for="`address-${index}`"
          class="text-xs -mt-2 w-16 bg-black z-10 relative ml-24 text-center"
          >ADDRESS</label
        >
        <button
          for="address"
          class="-mt-6 w-2 bg-black z-10 relative ml-56 text-center font-extrabold text-lg rounded-full focus:outline-none"
          @click="$emit('add')"
          v-if="address.status == 'confirmed'"
        >
          +
        </button>

        <Listbox
          @input="selectSuggestion"
          class="w-56 max-h-48 bg-gray-800 shadow overflow-y-auto"
          v-if="suggestions.length > 0"
        >
          <ListboxLabel class="sr-only"> Select a suggestion: </ListboxLabel>
          <ListboxButton class="hidden">hidden button</ListboxButton>
          <ListboxList
            v-show="searchState != null && address.status == null"
            :ref="`listbox-list-${index}`"
          >
            <ListboxOption
              v-for="suggestion in displayedSuggestions"
              :key="suggestion.description"
              :value="suggestion"
              v-show="searchState == 'searching' || !suggestion.pseudo"
              v-slot="{ isActive, isSelected }"
            >
              <div
                class="px-3 py-1 cursor-pointer"
                :class="isActive || isSelected ? 'bg-gray-700' : ''"
              >
                {{ suggestion.description }}
              </div>
            </ListboxOption>
          </ListboxList>
        </Listbox>
      </div>
      <div
        class="text-white flex flex-col ml-3"
        v-if="address.status == 'setting'"
      >
        <input
          type="text"
          class="focus:outline-none bg-transparent border-b border-l border-white w-24 px-1"
          :id="`addressNumber-${index}`"
          v-model="address.number"
          :ref="`addressNumber-${index}`"
          @blur="confirmAddress()"
        />
        <label
          :for="`addressNumber-${index}`"
          class="text-sm -mt-3 w-6 bg-black z-10 relative ml-10 text-center"
          >N <sup class="-ml-1">o</sup></label
        >
      </div>
      <button
        class="h-5 w-5 bg-gray-700 rounded-full text-white font-extrabold flex items-center justify-center cursor-pointer text-xs -ml-4 mr-4 z-10 focus:outline-none"
        type="button"
        @click="cancel()"
        v-if="address.status != 'setting' && addressText"
      >
        <span>X</span>
      </button>
    </div>
  </div>
</template>

<script>
import debounce from "debounce";
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
  computed: {
    displayedSuggestions() {
      if (this.searchState !== "returned")
        return [{ description: "Searching...", pseudo: true }];
      return this.suggestions;
    }
  },
  data: () => ({
    address: {
      place: null,
      text: null,
      number: null,
      status: null
    },
    addressFocus: false,
    addressText: null,
    suggestion: null,
    suggestions: [],
    searchState: null,
    summary: null,
    toolTipFocus: false
  }),
  methods: {
    addressInputFocused() {
      this.addressFocus = true;
      this.address.status = null;
    },
    confirmAddress() {
      if (!this.address.place) return;
      if (!this.addressText.includes(this.address.number)) {
        this.addressText = `${this.address.number} ${this.addressText}`;
      }

      this.address.status = "confirmed";
      const index = this.index;
      const route = this.address.place.address_components.find((component) =>
        component.types.find((type) => type == "route")
      );
      const postalCode = this.address.place.address_components.find(
        (component) => component.types.find((type) => type == "postal_code")
      );
      const adminAreaLevel2 = this.address.place.address_components.find(
        (component) =>
          component.types.find((type) => type == "administrative_area_level_2")
      );
      const adminAreaLevel1 = this.address.place.address_components.find(
        (component) =>
          component.types.find((type) => type == "administrative_area_level_1")
      );

      const country = this.address.place.address_components.find((component) =>
        component.types.find((type) => type == "country")
      );

      this.summary = {
        text: this.addressText,
        houseNumber: this.address.number,
        street: route ? route.long_name : null,
        zipCode: postalCode ? postalCode.long_name : null,
        town: adminAreaLevel2 ? adminAreaLevel2.long_name : null,
        majorTown: adminAreaLevel1 ? adminAreaLevel1.long_name : null,
        country: country ? country.long_name : null,
        coordinates: {
          lat: this.address.place.geometry.location.lat(),
          lng: this.address.place.geometry.location.lng()
        },
        placeId: this.address.placeId
      };

      this.$emit("update", {
        index,
        data: this.summary
      });
    },
    cancel() {
      this.address = {
        placeId: null,
        place: null,
        text: null,
        number: null,
        status: null
      };
      this.addressText = null;
      this.suggestions = [];
      this.searchState = null;
      this.summary = null;
    },
    focusOnListBox() {
      if (this.$refs[`listbox-list-${this.index}`])
        this.$refs[`listbox-list-${this.index}`].$el.focus();
    },
    getPlace(request) {
      var pyrmont = new google.maps.LatLng(0, 0);

      var map = new google.maps.Map(document.querySelector(".map"), {
        center: pyrmont,
        zoom: 15
      });
      var service = new google.maps.places.PlacesService(map);

      return new Promise((resolve, reject) => {
        service.getDetails(request, (place, status) => {
          if (status != google.maps.places.PlacesServiceStatus.OK)
            return reject(status);
          return resolve(place);
        });
      });
    },
    // wait for user to finish typing
    search: debounce(async function () {
      if (!this.addressText) return (this.suggestions = []);
      this.searchState = "searching";
      try {
        this.suggestions = await this.searchPlaces(this.addressText);
      } catch (error) {
        this.suggestions = [];
      }
      this.searchState = "returned";
    }, 500),
    searchPlaces(input) {
      var service = new google.maps.places.AutocompleteService();
      return new Promise((resolve, reject) => {
        service.getQueryPredictions({ input }, (suggestions, status) => {
          if (status != google.maps.places.PlacesServiceStatus.OK)
            return reject(status);

          return resolve(suggestions);
        });
      });
    },
    async selectSuggestion(suggestion) {
      this.address.text = suggestion.description;
      this.addressText = suggestion.description;
      this.address.status = "setting";
      this.address.number = null;
      this.address.placeId = suggestion.place_id;

      // request details of the selected place from google maps
      this.address.place = await this.getPlace({
        placeId: suggestion.place_id,
        fields: ["address_component", "formatted_address", "geometry"]
      });

      // set house number if not yet entered
      const streetNumber = this.address.place.address_components.find(
        (component) => component.types.find((type) => type == "street_number")
      );

      if (streetNumber && !this.address.number)
        this.address.number = streetNumber.long_name;
    }
  },
  props: {
    index: Number,
    toolTip: String
  },
  updated() {
    if (this.$refs[`addressNumber-${this.index}`])
      this.$refs[`addressNumber-${this.index}`].focus();
  }
};
</script>

<style scoped>
/* 
  Scrollbar 
*/
::-webkit-scrollbar {
  width: 8px;
}
/* Track */
::-webkit-scrollbar-track {
  background: transparent;
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}
/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>