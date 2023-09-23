// 解析 URL 中的 transactionId 參數
const urlParams = new URLSearchParams(window.location.search);
const AccountBookId = urlParams.get("AccountBookId");

var accountBookNameElement = document.getElementById("AccountBookName");

var categoryTableBody = document.getElementById("categoryTableBody");
var addButton = document.querySelector(".button22 a");

fetch(`/api/Category/GetCategory?accountBookId=${AccountBookId}`)
  .then((response) => response.json())
  .then((data) => {
    accountBookNameElement.textContent = data[0].accountBookName;

    // 遍歷數據 生成表格
    data.forEach((category) => {
      var row = document.createElement("tr");
      row.innerHTML = `
          <td>${category.category_name}</td>
          <td>${category.display_category_type}</td>
          <td> <a class="deleteButton btn btn-danger btn-sm" data-CategoryId="${category.category_and_account_id}"><i class="fas fa-trash"></i></a></td>
        `;
      categoryTableBody.appendChild(row);
    });

    //給新增帳本的button包含AccountBookId的超連結
    var addButtonLink =
      addButton.getAttribute("href") + `?AccountBookId=${AccountBookId}`;
    addButton.setAttribute("href", addButtonLink);

    const deleteButtons = document.querySelectorAll(".deleteButton");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const categoryId = button.getAttribute("data-CategoryId");

        const result = await Swal.fire({
          title: "確認刪除",
          text: "你確認刪除這個類別嗎?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
        });

        if (result.isConfirmed) {
          fetch(`/api/Category/CategoryStatus`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ category_and_account_id: categoryId }),
          })
            .then((response) => response.json())
            .then((response) => {
              Swal.fire("成功", "類別已成功刪除！", "success");
              window.location.reload();
              console.log("Category deleted:", response);
            })
            .catch((error) => {
              Swal.fire("成功", "類別已成功刪除！", "success");
              window.location.reload();
            });
        }
      });
    });
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
