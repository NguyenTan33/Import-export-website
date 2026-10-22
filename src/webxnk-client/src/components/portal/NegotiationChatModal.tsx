"use client";

import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import {
  Send,
  X,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Building2,
  User,
  Sparkles,
} from "lucide-react";

interface NegotiationItem {
  productId: number;
  productName?: string;
  quantity: number;
  quotedUnitPriceUsd?: number;
  targetPriceUsd?: number;
}

interface ChatMessage {
  id: string;
  sender: "BUYER" | "SALES" | "SYSTEM";
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  counterOffer?: {
    itemIndex: number;
    productName?: string;
    oldPrice: number;
    newPrice: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
  };
}

interface NegotiationChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfqNumber: string;
  rfqId: number;
  currentTotalUsd: number;
  items: NegotiationItem[];
  onAcceptPrice?: (newTotalUsd: number) => void;
}

export const NegotiationChatModal: React.FC<NegotiationChatModalProps> = ({
  isOpen,
  onClose,
  rfqNumber,
  rfqId,
  currentTotalUsd,
  items,
  onAcceptPrice,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [negotiationStatus, setNegotiationStatus] = useState<
    "ACTIVE" | "AGREED"
  >("ACTIVE");
  const [agreedTotal, setAgreedTotal] = useState<number>(currentTotalUsd);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<signalR.HubConnection | null>(null);

  // Initialize messages and counter price
  useEffect(() => {
    if (isOpen) {
      setIsConnected(false);
      setConnectionFailed(false);
      const firstItem = items[0];
      const initialPrice =
        firstItem?.quotedUnitPriceUsd || firstItem?.targetPriceUsd || 10;
      setCounterPrice(Number((initialPrice * 0.95).toFixed(2))); // Suggest 5% discount default

      const initialMsgs: ChatMessage[] = [
        {
          id: "m1",
          sender: "SYSTEM",
          senderName: "Hệ thống WebXNK",
          senderRole: "System Bot",
          content: `Phiên đàm phán trực tuyến cho đơn báo giá ${rfqNumber} đã được khởi tạo. Kênh kết nối SignalR mã hóa SSL 256-bit.`,
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        {
          id: "m2",
          sender: "SALES",
          senderName: "Trần Anh Tuấn",
          senderRole: "Trưởng phòng Kinh doanh Quốc tế - Quang Tấn Hoàng",
          content: `Kính chào Quý đối tác! Tôi phụ trách hỗ trợ đàm phán hợp đồng cho đơn hàng xuất khẩu ${rfqNumber}. Quý khách vui lòng gửi mức giá đề xuất hoặc yêu cầu chiết khấu container theo sản lượng thực tế.`,
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];
      setMessages(initialMsgs);

      // Attempt SignalR Hub connection
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const hubUrl = `${apiUrl.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "")}/hubs/negotiation`;

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
          accessTokenFactory: () => window.localStorage.getItem("webxnk_token") || "",
        })
        .withAutomaticReconnect()
        .build();
      hubRef.current = connection;
      let disposed = false;
      const receiveMessage = (message: ChatMessage) => {
        if (!message || typeof message.content !== "string") return;
        setMessages((previous) => [...previous, message]);
      };
      connection.on("ReceiveNegotiationMessage", receiveMessage);
      connection.onreconnecting(() => {
        if (!disposed) setIsConnected(false);
      });
      connection.onreconnected(() => {
        if (!disposed) {
          setIsConnected(true);
          setConnectionFailed(false);
          void connection.invoke("JoinRfqRoom", String(rfqId)).catch(() => {
            setIsConnected(false);
            setConnectionFailed(true);
          });
        }
      });
      connection.onclose(() => {
        if (!disposed) {
          setIsConnected(false);
          setConnectionFailed(true);
        }
      });

      const startConnection = async () => {
        if (connection.state !== signalR.HubConnectionState.Disconnected) return;
        try {
          await connection.start();
          if (disposed) return;
          await connection.invoke("JoinRfqRoom", String(rfqId));
          if (!disposed) {
            setIsConnected(true);
            setConnectionFailed(false);
          }
        } catch {
          if (!disposed) {
            setIsConnected(false);
            setConnectionFailed(true);
          }
        }
      };
      void startConnection();

      return () => {
        disposed = true;
        connection.off("ReceiveNegotiationMessage", receiveMessage);
        if (hubRef.current === connection) hubRef.current = null;
        if (connection.state !== signalR.HubConnectionState.Disconnected &&
            connection.state !== signalR.HubConnectionState.Disconnecting) {
          void connection.stop().catch(() => {});
        }
      };
    }
  }, [isOpen, rfqId, rfqNumber, items]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: "BUYER",
      senderName: "Doanh nghiệp của bạn",
      senderRole: "Đại diện Thu mua (Buyer)",
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setInputMessage("");

    const connection = hubRef.current;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      void connection.invoke("SendNegotiationMessage", rfqId, newMsg.content)
        .catch(() => {
          setIsConnected(false);
          setConnectionFailed(true);
          setMessages((previous) => [...previous, newMsg]);
        });
      return;
    }

    setMessages((prev) => [...prev, newMsg]);

    // Simulate Sales Specialist automated response
    setTimeout(() => {
      const salesReply: ChatMessage = {
        id: `m_rep_${Date.now()}`,
        sender: "SALES",
        senderName: "Trần Anh Tuấn",
        senderRole: "Trưởng phòng Kinh doanh Quốc tế - Quang Tấn Hoàng",
        content: `Cảm ơn Quý đối tác. Ban giám đốc Quang Tấn Hoàng đã xem xét đề xuất. Đối với đơn hàng đóng container chuẩn xuất khẩu, chúng tôi có thể áp dụng chính sách chiết khấu theo biểu giá bậc thang mới nhất.`,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, salesReply]);
    }, 1200);
  };

  const handleSendCounterOffer = () => {
    const item = items[selectedItemIdx];
    if (!item) return;

    const currentPrice = item.quotedUnitPriceUsd || item.targetPriceUsd || 10;
    const discountPercent = (
      ((currentPrice - counterPrice) / currentPrice) *
      100
    ).toFixed(1);

    const offerMsg: ChatMessage = {
      id: `offer_${Date.now()}`,
      sender: "BUYER",
      senderName: "Doanh nghiệp của bạn",
      senderRole: "Đại diện Thu mua (Buyer)",
      content: `Chúng tôi đề xuất mức giá mới cho mặt hàng "${item.productName}" (SL: ${item.quantity.toLocaleString()} cái): từ $${currentPrice.toFixed(2)} USD giảm còn $${counterPrice.toFixed(2)} USD/đơn vị (Chiết khấu ${discountPercent}%).`,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      counterOffer: {
        itemIndex: selectedItemIdx,
        productName: item.productName,
        oldPrice: currentPrice,
        newPrice: counterPrice,
        status: "PENDING",
      },
    };

    const connection = hubRef.current;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      void connection.invoke("SendNegotiationMessage", rfqId, offerMsg.content, offerMsg.counterOffer)
        .catch(() => {
          setIsConnected(false);
          setConnectionFailed(true);
          setMessages((previous) => [...previous, offerMsg]);
        });
      return;
    }

    setMessages((prev) => [...prev, offerMsg]);

    // Sales Department Response to counter-offer
    setTimeout(() => {
      const agreedUnitPrice = Number((counterPrice * 1.01).toFixed(2)); // Minor compromise or full accept
      const finalPrice = Math.min(counterPrice, agreedUnitPrice);
      const newTotal = items.reduce((sum, it, idx) => {
        const p =
          idx === selectedItemIdx
            ? finalPrice
            : it.quotedUnitPriceUsd || it.targetPriceUsd || 10;
        return sum + p * it.quantity;
      }, 0);

      const salesAcceptMsg: ChatMessage = {
        id: `accept_${Date.now()}`,
        sender: "SALES",
        senderName: "Trần Anh Tuấn",
        senderRole: "Trưởng phòng Kinh doanh Quốc tế - Quang Tấn Hoàng",
        content: `[QUANG TẤN HOÀNG CHẤP THUẬN BÁO GIÁ] Công ty Quang Tấn Hoàng đồng ý mức giá ưu đãi $${finalPrice.toFixed(2)} USD/đơn vị cho lô hàng ${item.quantity.toLocaleString()} sản phẩm. Tổng giá trị đơn hàng sau chiết khấu là $${newTotal.toLocaleString("en-US")} USD theo điều kiện FOB Cát Lái. Quý khách có thể xác nhận để hệ thống xuất Proforma Invoice cập nhật!`,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        counterOffer: {
          itemIndex: selectedItemIdx,
          productName: item.productName,
          oldPrice: currentPrice,
          newPrice: finalPrice,
          status: "ACCEPTED",
        },
      };

      setMessages((prev) => [...prev, salesAcceptMsg]);
      setAgreedTotal(newTotal);
    }, 2000);
  };

  const handleFinalizeAgreement = () => {
    setNegotiationStatus("AGREED");
    if (onAcceptPrice) {
      onAcceptPrice(agreedTotal);
    }
    const finalSysMsg: ChatMessage = {
      id: `sys_final_${Date.now()}`,
      sender: "SYSTEM",
      senderName: "Hệ thống WebXNK",
      senderRole: "System Bot",
      content: `ĐƠN HÀNG ĐÃ ĐƯỢC CHỐT GIÁ THÀNH CÔNG! Tổng giá trị hợp đồng mới: $${agreedTotal.toLocaleString("en-US")} USD. Bản Proforma Invoice chính thức đã được đồng bộ vào hệ thống.`,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, finalSysMsg]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex flex-col w-full max-w-4xl h-[88vh] bg-white border border-black shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-black text-white px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#0E4B94] rounded flex items-center justify-center text-white font-black text-xs">
              QTH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Đàm phán giá Realtime (SignalR) — {rfqNumber}
                </h3>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isConnected ? "SignalR Live" : connectionFailed ? "Ngoại tuyến · mô phỏng cục bộ" : "Đang kết nối..."}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG • B2B RFQ Room
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">
                Tổng tiền RFQ hiện tại
              </span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                ${agreedTotal.toLocaleString("en-US")} USD
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-neutral-100 border-b border-neutral-200 px-5 py-2 flex flex-wrap items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4 text-neutral-600">
            <span>
              <strong>Mã RFQ:</strong> #{rfqId}
            </span>
            <span>
              <strong>Số mặt hàng:</strong> {items?.length} sp
            </span>
            <span className="flex items-center gap-1 text-[#0E4B94]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Bảo mật đàm phán hợp đồng B2B
            </span>
          </div>
          {negotiationStatus === "AGREED" ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ĐÃ THỐNG NHẤT GIÁ BÁO
            </span>
          ) : (
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
              ĐANG THƯƠNG LƯỢNG
            </span>
          )}
        </div>

        {/* Main Body: Messages and Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages Column */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 bg-neutral-50/50">
            {messages.map((msg, index) => {
              if (msg.sender === "SYSTEM") {
                return (
                  <div key={msg.id ?? `message-${index}`} className="text-center my-2">
                    <span className="inline-block bg-neutral-200 text-neutral-700 text-[11px] font-mono px-3 py-1 rounded">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              const isBuyer = msg.sender === "BUYER";

              return (
                <div
                  key={msg.id ?? `message-${index}`}
                  className={`flex gap-3 max-w-[85%] ${isBuyer ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isBuyer
                        ? "bg-black text-white"
                        : "bg-[#0E4B94] text-white"
                    }`}
                  >
                    {isBuyer ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div
                      className={`flex items-baseline gap-2 mb-1 text-[11px] ${
                        isBuyer ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="font-bold text-neutral-900">
                        {msg.senderName}
                      </span>
                      <span className="text-neutral-400 font-mono text-[10px]">
                        {msg.timestamp}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 text-xs leading-relaxed rounded-md shadow-sm ${
                        isBuyer
                          ? "bg-black text-white"
                          : "bg-white border border-neutral-200 text-neutral-800"
                      }`}
                    >
                      {msg.content}

                      {/* Counter Offer Card if attached */}
                      {msg.counterOffer && (
                        <div
                          className={`mt-2.5 p-2.5 rounded border text-[11px] font-mono ${
                            msg.counterOffer.status === "ACCEPTED"
                              ? "bg-emerald-950 text-emerald-200 border-emerald-500"
                              : isBuyer
                                ? "bg-neutral-900 text-neutral-200 border-neutral-700"
                                : "bg-neutral-50 text-neutral-800 border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold pb-1 border-b border-white/10 mb-1.5">
                            <span>
                              ĐỀ XUẤT GIÁ: {msg.counterOffer.productName}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                msg.counterOffer.status === "ACCEPTED"
                                  ? "bg-emerald-500 text-black font-black"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {msg.counterOffer.status === "ACCEPTED"
                                ? "ĐÃ CHẤP THUẬN"
                                : "CHỜ DUYỆT"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div>
                              <span className="text-[10px] text-neutral-400 block">
                                Giá gốc:
                              </span>
                              <span className="line-through text-red-300">
                                ${msg.counterOffer.oldPrice.toFixed(2)} USD
                              </span>
                            </div>
                            <span className="text-neutral-400">→</span>
                            <div>
                              <span className="text-[10px] text-neutral-400 block">
                                Giá đề xuất:
                              </span>
                              <span className="text-emerald-400 font-black">
                                ${msg.counterOffer.newPrice.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Right Panel: Counter-Offer Tools & Fast Actions */}
          <div className="hidden md:flex w-80 flex-col border-l border-neutral-200 bg-white p-4 space-y-4">
            <div className="border-b border-neutral-200 pb-3">
              <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                CÔNG CỤ B2B COUNTER-OFFER
              </span>
              <h4 className="text-xs font-bold text-neutral-900 mt-0.5">
                Đề xuất giảm giá theo lô hàng
              </h4>
            </div>

            {/* Select Item */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-neutral-700 mb-1">
                Chọn sản phẩm thương lượng:
              </label>
              <select
                value={selectedItemIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedItemIdx(idx);
                  const p =
                    items[idx]?.quotedUnitPriceUsd ||
                    items[idx]?.targetPriceUsd ||
                    10;
                  setCounterPrice(Number((p * 0.95).toFixed(2)));
                }}
                className="w-full border border-neutral-300 p-2 text-xs font-mono bg-neutral-50 focus:outline-none focus:border-black"
              >
                {items?.map((it, idx) => (
                  <option key={idx} value={idx}>
                    {it.productName} ({it.quantity} cái)
                  </option>
                ))}
              </select>
            </div>

            {/* Counter Price Input */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-neutral-700 mb-1">
                Mức giá mong muốn (USD/đơn vị):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-neutral-400">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="w-full border border-neutral-300 pl-7 pr-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Send Counter Offer Button */}
            <button
              type="button"
              onClick={handleSendCounterOffer}
              disabled={negotiationStatus === "AGREED"}
              className="w-full flex items-center justify-center gap-1.5 bg-[#0E4B94] py-2 text-xs font-bold uppercase text-white hover:bg-[#0a376d] disabled:opacity-50 transition-colors shadow-sm"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Gửi đề xuất giá mới</span>
            </button>

            <div className="border-t border-neutral-200 pt-3 space-y-2">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                Hành động chốt đơn
              </span>
              <button
                type="button"
                onClick={handleFinalizeAgreement}
                disabled={negotiationStatus === "AGREED"}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 py-2.5 text-xs font-bold uppercase text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Chấp thuận & Chốt giá này</span>
              </button>
            </div>

            <div className="mt-auto border border-neutral-200 bg-neutral-50 p-3 rounded text-[11px] font-mono text-neutral-500 space-y-1">
              <div className="flex items-center gap-1 text-[#0E4B94] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>Quy tắc đàm phán</span>
              </div>
              <p>
                Mọi điều khoản giá được xác nhận trên kênh SignalR đều có giá
                trị pháp lý trong hợp đồng ngoại thương tương ứng.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer: Chat Input */}
        <div className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Nhập nội dung trao đổi với chuyên viên kinh doanh xuất khẩu Quang Tấn Hoàng..."
            className="flex-1 border border-neutral-300 px-4 py-2 text-xs focus:outline-none focus:border-black font-sans"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="flex items-center gap-1.5 bg-black px-4 py-2 text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gửi tin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
