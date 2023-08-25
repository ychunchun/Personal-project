document.addEventListener("DOMContentLoaded", async function () {
  const categoryTypeSelect = document.getElementById("categoryType");
  const categoryList = document.getElementById("categoryList");

  categoryTypeSelect.addEventListener("change", async function () {
    const selectedCategoryType = categoryTypeSelect.value;

    try {
      const response = await fetch(
        `/api/Category/GetCategory?displayType=${selectedCategoryType}`
      );
      const categories = await response.json();

      // Clear previous category list
      categoryList.innerHTML = "";

      // Populate the categoryList with fetched categories
      categories.forEach((category) => {
        const categoryItem = document.createElement("div");
        categoryItem.textContent = category.category_name;
        categoryList.appendChild(categoryItem);
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  });
});
