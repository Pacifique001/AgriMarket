"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Send,
  Loader2,
  DollarSign,
  MapPin,
  Scale,
  Phone,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

import { messagesService, Message } from "@/services/messages";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface BargainModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  listingCrop: string;
  listingQuantity?: number;
  listingAskingPrice?: number;
  listingDistrict?: string;
  otherPartyName: string;
  otherPartyPhone?: string;
  otherPartyRole?: string;
  currentMatchStatus?: string;
  onAcceptDeal?: () => void;
}

export function BargainModal({
  isOpen,
  onClose,
  matchId,
  listingCrop,
  listingQuantity,
  listingAskingPrice,
  listingDistrict,
  otherPartyName,
  otherPartyPhone,
  otherPartyRole,
  currentMatchStatus,
  onAcceptDeal
}: BargainModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.sub ? Number(user.sub) : null;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState("");
  const [showBargainTools, setShowBargainTools] = useState(false);
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [offerQuantity, setOfferQuantity] = useState<string>("");
  const [proposedPlace, setProposedPlace] = useState<string>("");

  // 1. Fetch messages for this match
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => messagesService.getMessages(matchId),
    enabled: isOpen && !!matchId,
    refetchInterval: isOpen ? 4000 : false, // Poll every 4s while open
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 2. Mutation: Send message
  const sendMutation = useMutation({
    mutationFn: (payload: {
      content: string;
      offered_price?: number;
      offered_quantity?: number;
      proposed_location?: string;
    }) => messagesService.sendMessage(matchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
      setContent("");
      setOfferPrice("");
      setOfferQuantity("");
      setProposedPlace("");
      setShowBargainTools(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to deliver message");
    }
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !offerPrice && !proposedPlace) return;

    let messageBody = content.trim();
    if (!messageBody) {
      if (offerPrice && proposedPlace) {
        messageBody = `I propose ${offerPrice} RWF/kg and delivery/pickup at ${proposedPlace}.`;
      } else if (offerPrice) {
        messageBody = `I propose a counter price of ${offerPrice} RWF/kg.`;
      } else if (proposedPlace) {
        messageBody = `Proposed meeting place: ${proposedPlace}.`;
      }
    }

    sendMutation.mutate({
      content: messageBody,
      offered_price: offerPrice ? Number(offerPrice) : undefined,
      offered_quantity: offerQuantity ? Number(offerQuantity) : undefined,
      proposed_location: proposedPlace.trim() || undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* --- Header --- */}
        <div className="p-4 md:p-5 border-b bg-gradient-to-r from-slate-900 to-green-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-700/60 border border-green-500/30 rounded-2xl">
              <MessageSquare size={22} className="text-green-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">{otherPartyName}</h3>
                <span className="text-[10px] bg-green-800 text-green-200 px-2 py-0.5 rounded-full font-bold uppercase">
                  {otherPartyRole || "Participant"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5 font-medium">
                {otherPartyPhone && (
                  <a href={`tel:${otherPartyPhone}`} className="hover:text-green-400 flex items-center gap-1">
                    <Phone size={12} /> {otherPartyPhone}
                  </a>
                )}
                <span>• {listingCrop} ({listingDistrict || "Rwanda"})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAcceptDeal && currentMatchStatus !== "accepted" && (
              <button
                onClick={onAcceptDeal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-green-950 hover:bg-yellow-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                <CheckCircle2 size={14} /> Accept Deal
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- Harvest Context Snapshot Bar --- */}
        <div className="bg-slate-50 border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-bold text-slate-800">
              <Sparkles size={14} className="text-green-600" /> Harvest: {listingCrop}
            </span>
            {listingQuantity && (
              <span className="flex items-center gap-1">
                <Scale size={13} className="text-slate-400" /> {listingQuantity.toLocaleString()} kg
              </span>
            )}
            {listingAskingPrice && (
              <span className="flex items-center gap-1">
                <DollarSign size={13} className="text-slate-400" /> Asking: {listingAskingPrice.toLocaleString()} RWF/kg
              </span>
            )}
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
            Status: {currentMatchStatus || "negotiating"}
          </span>
        </div>

        {/* --- Messages Stream --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin text-green-700" size={32} />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
              <div className="p-3 bg-green-50 text-green-700 rounded-full">
                <MessageSquare size={32} />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Direct Negotiation Channel</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Discuss price, negotiate payment terms, and agree on a pickup or delivery place.
                Messages are alert-enabled via SMS.
              </p>
            </div>
          ) : (
            messages?.map((msg) => {
              const isMe = currentUserId !== null && msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] md:max-w-[75%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <span className="text-[10px] text-slate-400 mb-1 px-1 font-semibold">
                    {isMe ? "You" : msg.sender_name || otherPartyName} •{" "}
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed space-y-2",
                      isMe
                        ? "bg-green-700 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                    )}
                  >
                    <p>{msg.content}</p>

                    {/* Bargain Offer Pill / Card if attached */}
                    {(msg.offered_price || msg.proposed_location || msg.offered_quantity) && (
                      <div
                        className={cn(
                          "p-2.5 rounded-xl text-xs font-semibold space-y-1 mt-2 border",
                          isMe
                            ? "bg-green-800/80 border-green-600 text-green-50"
                            : "bg-amber-50 border-amber-200 text-amber-900"
                        )}
                      >
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                          <DollarSign size={12} /> Bargain Proposal
                        </div>
                        {msg.offered_price && (
                          <div className="flex items-center gap-1.5">
                            <span>Offered Price:</span>
                            <span className="font-black text-sm">{msg.offered_price.toLocaleString()} RWF/kg</span>
                          </div>
                        )}
                        {msg.offered_quantity && (
                          <div className="flex items-center gap-1.5 text-xs opacity-90">
                            <Scale size={12} /> Quantity: {msg.offered_quantity.toLocaleString()} kg
                          </div>
                        )}
                        {msg.proposed_location && (
                          <div className="flex items-center gap-1.5 text-xs opacity-90">
                            <MapPin size={12} /> Meeting Place: {msg.proposed_location}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* --- Bargaining Toolbar Toggle --- */}
        <div className="border-t bg-white px-4 py-2 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowBargainTools(!showBargainTools)}
            className="flex items-center gap-1.5 font-bold text-green-700 hover:text-green-800 transition"
          >
            <DollarSign size={15} />
            {showBargainTools ? "Hide Bargaining Fields" : "Attach Price / Location Offer"}
            {showBargainTools ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <span className="text-[10px] text-slate-400 font-medium">SMS Alerts Active</span>
        </div>

        {/* --- Expandable Bargain Inputs --- */}
        {showBargainTools && (
          <div className="px-4 py-3 bg-green-50/70 border-t border-green-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in slide-in-from-bottom duration-200">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-green-900 block mb-1">
                Your Price Offer (RWF/kg)
              </label>
              <input
                type="number"
                placeholder={listingAskingPrice ? `e.g. ${listingAskingPrice}` : "e.g. 400"}
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full bg-white border border-green-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-green-900 block mb-1">
                Quantity (kg)
              </label>
              <input
                type="number"
                placeholder={listingQuantity ? `e.g. ${listingQuantity}` : "e.g. 1000"}
                value={offerQuantity}
                onChange={(e) => setOfferQuantity(e.target.value)}
                className="w-full bg-white border border-green-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-green-900 block mb-1">
                Meeting / Delivery Place
              </label>
              <input
                type="text"
                placeholder="e.g. Musanze Market / Farm gate"
                value={proposedPlace}
                onChange={(e) => setProposedPlace(e.target.value)}
                className="w-full bg-white border border-green-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>
        )}

        {/* --- Chat Input & Action Bar --- */}
        <form onSubmit={handleSend} className="p-3 md:p-4 bg-white border-t flex items-center gap-2">
          <input
            type="text"
            placeholder={
              showBargainTools
                ? "Add an optional negotiation note..."
                : "Type message to bargain on price, place, or dates..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 input-field py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || (!content.trim() && !offerPrice && !proposedPlace)}
            className="btn-primary py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
