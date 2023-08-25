using System;
using System.Threading.Tasks;
using Microsoft.Owin;
using Owin;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Owin.Cors;

namespace Personal_project.Hubs{
    public class AddTransactionHub:Hub{
        public async Task SendAddTransaction(string transactionInfo)
        {
            // 在伺服器端輸出日誌，確認資料是否到達
            Console.WriteLine("Received transaction info: " + transactionInfo);
            
            // 將資料傳送給所有連接的客戶端
            await Clients.All.SendAsync("ReceiveTransactionNotification", transactionInfo);
        } 
    }
}