<template>
  <div
    class="flex items-center justify-center h-screen w-screen overflow-y-auto"
  >
    <div class="hidden map"></div>
    <div class="flex flex-col items-center">
      <span class="font-bold text-lg mb-2 text-gray-600">Upload a file</span>
      <input-file
        v-model="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        class="mt-6 w-24"
      >
        <div
          v-if="!file"
          class="rounded-lg focus:outline-none h-24 w-24 border-dashed border-4 flex items-center justify-center"
        >
          <upload class="h-20 text-gray-600" />
        </div>
        <div v-else class="flex flex-col items-center space-y-2">
          <div class="flex">
            <file-text class="" />
            <button
              class="bg-gray-600 text-white h-4 w-4 rounded-full flex items-center justify-center focus:outline-none -mt-3"
              @click="file = null"
            >
              <dismiss class="h-5" />
            </button>
          </div>
          <span class="text-xs block text-center"
            >Processing {{ file.name }}...</span
          >
          <span class="text-xs block text-green-500"
            >Successful: {{ processed }} of {{ fileArray.length }}</span
          >
          <span
            class="text-xs block text-red-500 w-120 text-center"
            v-for="(error, errorIndex) in errors.slice(0, 15)"
            :key="`errors-${errorIndex}`"
            >{{ error }}</span
          >
        </div>
      </input-file>
    </div>
  </div>
</template>

<script>
import XLSX from "xlsx";
export default {
  data: () => ({
    file: null,
    fileArray: [],
    errors: [],
    processed: 0,
    workBook: null
  }),
  methods: {
    async excelExport() {
      var items = [];
      for (const item of this.fileArray) {
        try {
          const location = await this.setLongtitudeAndLatitude(item.address);
          items.push({ ...item, ...location });
          this.processed++;
        } catch (error) {
          console.log(error);
          this.errors.push(`Address not found for ${item.address}`);
        }
      }

      const workSheet = XLSX.utils.json_to_sheet(items, {
        header: Object.keys(items[0])
      });

      XLSX.writeFile(
        { Sheets: { locations: workSheet }, SheetNames: ["locations"] },
        `processed-${this.file.name}`
      );
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
    importGoogleMaps() {
      var scriptTag = document.createElement("script");
      scriptTag.setAttribute(
        "src",
        `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`
      );
      document["body"].appendChild(scriptTag);
    },
    processWorkBook(workBook, header) {
      let results = [];
      workBook.SheetNames.forEach((sheetName) => {
        const sheetData = XLSX.utils.sheet_to_json(workBook.Sheets[sheetName], {
          header
        });
        results = results.concat(sheetData);
      });
      return results;
    },
    readFile(file, type = "array") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workBook = XLSX.read(data, { type });
          resolve(workBook);
        };
        reader.addEventListener("abort", (e) => reject(e));
        reader.readAsArrayBuffer(file);
      });
    },
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
    async setLongtitudeAndLatitude(address) {
      const [suggestion] = await this.searchPlaces(address);
      // wait 500 ms before next request
      await new Promise((resolve) => setTimeout(resolve, 100));
      // request details of the selected place from google maps
      const location = await this.getPlace({
        placeId: suggestion.place_id,
        fields: ["geometry"]
      });
      return {
        latitude: location.geometry.location.lat(),
        longtitude: location.geometry.location.lng()
      };
    }
  },
  mounted() {
    this.importGoogleMaps();
  },
  watch: {
    file: {
      deep: true,
      async handler(file) {
        if (!file) {
          return;
        }
        this.workBook = await this.readFile(file);
        this.fileArray = this.processWorkBook(this.workBook);
        this.excelExport();
      }
    }
  }
};
</script>
