document.addEventListener("DOMContentLoaded", async function () {
  // 解析 URL 中的 transactionId 參數
  const urlParams = new URLSearchParams(window.location.search);
  const AccountBookId = urlParams.get("AccountBookId");

  const form = document.getElementById("categoryForm");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const categoryType = form.category_type.value;
    const categoryName = form.category_name.value;

    const data = {
      category_type: categoryType,
      category_name: categoryName,
      AccountBookId: AccountBookId,
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
          icon: "成功",
          title: "成功",
          text: "已成功新增類別",
          confirmButtonText: "OK",
        }).then(() => {
          // 跳轉到顯示類別畫面
          window.location.href = "/admin/category_management.html";
        });
        // 清空輸入字段
        form.category_name.value = "";
      } else {
        // 處理錯誤回應，顯示錯誤通知
        Swal.fire({
          icon: "錯誤",
          title: "錯誤",
          text: "類別新增失敗",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      // 處理發送請求過程中的錯誤。
      console.error("Error sending request:", error);
    }
  });
});
