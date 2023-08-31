async function fetchAndDisplayAccountBooks() {
  ////////////////////呈現user所擁有的帳本////////////////////
  try {
    const accessToken = localStorage.getItem("access_token");
    const response = await fetch("/api/AccountBook/GetAccountBook", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }
    const data = await response.json();
    const accountBooks = data.accountBooks;
    const totalProfit = data.totalProfit;
    const currentUserId = data.currentUserId;

    const container = document.getElementById("AccountBookContainer");
    const totalProfitSpan = document.getElementById("totalProfit");

    totalProfitSpan.textContent = totalProfit;

    // 先對帳本排序，讓 Main帳本排在第一個
    accountBooks.sort((a, b) => {
      if (a.accountBookType === "main" && b.accountBookType !== "main") {
        return -1;
      }
      if (a.accountBookType !== "main" && b.accountBookType === "main") {
        return 1;
      }
      return 0;
    });

    accountBooks.forEach((accountBook) => {
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";

      const accountBookName = document.createElement("b");
      accountBookName.textContent = accountBook.accountBookName;
      accountBookName.className = "mr-auto";

      const profit = document.createElement("a");
      profit.textContent = "NT$  " + accountBook.profit;
      profit.className = "ml-auto mr-2"; //<a>標籤貼右邊並且加上margin

      //listItem.appendChild(accountBookType);
      listItem.appendChild(accountBookName);
      listItem.appendChild(profit);

      //判斷如果不是Main帳本
      if (
        accountBook.accountBookType !== "main" &&
        accountBook.adminUser === currentUserId
      ) {
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fa fa-trash";

        const deleteIconDiv = document.createElement("div");
        deleteIconDiv.style.display = "none";
        deleteIconDiv.textContent = accountBook.accountBookId;

        deleteIcon.appendChild(deleteIconDiv);

        const modifyIcon = document.createElement("i");
        modifyIcon.className = "fa fa-edit ml-2";

        const modifyIconDiv = document.createElement("div");
        modifyIconDiv.style.display = "none";
        modifyIconDiv.textContent = accountBook.accountBookId;

        modifyIcon.appendChild(modifyIconDiv);

        listItem.appendChild(accountBookName);
        listItem.appendChild(profit);
        listItem.appendChild(deleteIcon);
        listItem.appendChild(modifyIcon);

        container.appendChild(listItem);

        deleteIcon.addEventListener("click", async (event) => {
          if (accountBook.accountBookType === "main") {
            // Do not perform any action for main account books
            return;
          }
          const accountBookIdString =
            event.currentTarget.querySelector("i > div").textContent;
          const accountBookId = parseInt(accountBookIdString, 10);

          const result = await Swal.fire({
            title: "Confirm Deletion",
            text: "Do you want to delete this account book?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
          });

          if (result.isConfirmed) {
            // Send POST request to AccountBookStatus API
            try {
              const response = await fetch(
                "/api/AccountBook/AccountBookStatus",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization:
                      "Bearer " + localStorage.getItem("access_token"),
                  },
                  body: JSON.stringify({ AccountBookId: accountBookId }),
                }
              );

              if (response.ok) {
                location.reload();
              } else if (response.status === 403) {
                // 如果收到 403 Forbidden
                Swal.fire({
                  icon: "error",
                  title: "Access Denied",
                  text: "You do not have permission to perform this action.",
                });
              } else {
                console.error("Failed to delete account book");
              }
            } catch (error) {
              console.error("An error occurred:", error);
            }
          }
        });
      }

      container.appendChild(listItem);

      // listItem.addEventListener("click", async (event) => {
      //   if (accountBook.accountBookType === "main") {
      //     // Do not perform any action for main account books
      //     return;
      //   }
      //   const accountBookIdString =
      //     event.currentTarget.querySelector("i > div").textContent;
      //   const accountBookId = parseInt(accountBookIdString, 10);

      //   const result = await Swal.fire({
      //     title: "Confirm Deletion",
      //     text: "Do you want to delete this account book?",
      //     icon: "warning",
      //     showCancelButton: true,
      //     confirmButtonText: "Yes",
      //     cancelButtonText: "No",
      //   });

      //   if (result.isConfirmed) {
      //     // Send POST request to AccountBookStatus API
      //     try {
      //       const response = await fetch("/api/AccountBook/AccountBookStatus", {
      //         method: "POST",
      //         headers: {
      //           "Content-Type": "application/json",
      //           Authorization: "Bearer " + localStorage.getItem("access_token"),
      //         },
      //         body: JSON.stringify({ AccountBookId: accountBookId }),
      //       });

      //       if (response.ok) {
      //         location.reload();
      //       } else if (response.status === 403) {
      //         // 如果收到 403 Forbidden
      //         Swal.fire({
      //           icon: "error",
      //           title: "Access Denied",
      //           text: "You do not have permission to perform this action.",
      //         });
      //       } else {
      //         console.error("Failed to delete account book");
      //       }
      //     } catch (error) {
      //       console.error("An error occurred:", error);
      //     }
      //   }
      // });
    });
  } catch (error) {
    console.error("Error fetching data", error);
  }
}

fetchAndDisplayAccountBooks();
