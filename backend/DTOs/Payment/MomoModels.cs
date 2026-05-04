namespace DTOs.Payment
{
    public class MomoCreatePaymentRequest
    {
        public string partnerCode { get; set; } = string.Empty;
        public string partnerName { get; set; } = string.Empty;
        public string storeId { get; set; } = string.Empty;
        public string requestId { get; set; } = string.Empty;
        public long amount { get; set; }
        public string orderId { get; set; } = string.Empty;
        public string orderInfo { get; set; } = string.Empty;
        public string redirectUrl { get; set; } = string.Empty;
        public string ipnUrl { get; set; } = string.Empty;
        public string requestType { get; set; } = string.Empty;
        public string extraData { get; set; } = string.Empty;
        public string lang { get; set; } = "vi";
        public string signature { get; set; } = string.Empty;
    }

    public class MomoCreatePaymentResponse
    {
        public string partnerCode { get; set; } = string.Empty;
        public string orderId { get; set; } = string.Empty;
        public string requestId { get; set; } = string.Empty;
        public long amount { get; set; }
        public long responseTime { get; set; }
        public string message { get; set; } = string.Empty;
        public int resultCode { get; set; }
        public string payUrl { get; set; } = string.Empty;
        public string signature { get; set; } = string.Empty;
    }

    public class MomoResultRequest
    {
        public string partnerCode { get; set; } = string.Empty;
        public string orderId { get; set; } = string.Empty;
        public string requestId { get; set; } = string.Empty;
        public long amount { get; set; }
        public string orderInfo { get; set; } = string.Empty;
        public string orderType { get; set; } = string.Empty;
        public long transId { get; set; }
        public int resultCode { get; set; }
        public string message { get; set; } = string.Empty;
        public string payType { get; set; } = string.Empty;
        public long responseTime { get; set; }
        public string extraData { get; set; } = string.Empty;
        public string signature { get; set; } = string.Empty;
    }
}
