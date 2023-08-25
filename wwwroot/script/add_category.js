document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("categoryForm");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const categoryType = form.category_type.value;
    const categoryName = form.category_name.value;

    const data = {
      category_type: categoryType,
      category_name: categoryName,
    };

    try {
      const response = await fetch("/api/Category/AddCategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // 成功處理回應，顯示成功通知
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Category has been added successfully.",
          confirmButtonText: "OK",
        }).then(() => {
          // 跳轉到顯示類別畫面
          window.location.href = "/admin/show_category.html";
        });
        // 清空輸入字段
        form.category_name.value = "";
      } else {
        // 處理錯誤回應，顯示錯誤通知
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to add category.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      // 處理發送請求過程中的錯誤。
      console.error("Error sending request:", error);
    }
  });
});
