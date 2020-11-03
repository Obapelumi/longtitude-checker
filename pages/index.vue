<template>
  <div class="flex justify-center min-h-screen bg-white">
    <div class="flex flex-col my-16 text-white">
      <div
        class="flex bg-black mb-1"
        v-for="(address, index) in addresses"
        :key="index"
      >
        <div class="w-30 sm:w-36 text-center text-white bg-gray-900 p-2">
          <v-select-type
            class="ml-2 mt-1"
            :index="index"
            @update="updateAddress"
          />
        </div>
        <div class="bg-black p-3">
          <v-address-input
            :index="index"
            :toolTip="address.toolTip"
            @update="updateAddress"
            @add="addAddress"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  created() {
    this.addAddress();
  },
  data: () => ({
    addresses: []
  }),
  methods: {
    addAddress() {
      this.addresses.push({
        type: null,
        toolTip: null,
        text: null,
        houseNumber: null,
        street: null,
        zipCode: null,
        town: null,
        majorTown: null,
        country: null,
        coordinates: null
      });
    },
    importGoogleMaps() {
      var scriptTag = document.createElement("script");
      scriptTag.setAttribute(
        "src",
        `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`
      );
      document["body"].appendChild(scriptTag);
    },
    updateAddress({ index, data }) {
      for (const key in data) this.addresses[index][key] = data[key];
    }
  },
  mounted() {
    this.importGoogleMaps();
  }
};
</script>
