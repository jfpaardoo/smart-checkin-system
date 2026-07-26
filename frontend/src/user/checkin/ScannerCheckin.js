import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Form, FormGroup, Input } from 'reactstrap';
import { useToast } from '../../components/ToastProvider';
import { CardGhostLoader } from '../../components/GhostLoader';
import '../../static/css/admin/adminPage.css';

export default function ScannerCheckin() {
  const toast = useToast();
  const [totpToken, setTotpToken] = useState(null);
  const [personalCode, setPersonalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(true);

  useEffect(() => {
    let html5QrcodeScanner;
    
    if (scannerVisible) {
      // Configuration for the scanner
      html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          // Success callback
          setTotpToken(decodedText);
          setScannerVisible(false);
          // Stop scanning and clear the scanner UI
          html5QrcodeScanner.clear().catch(error => {
            console.error("Failed to clear html5QrcodeScanner. ", error);
          });
        },
        (errorMessage) => {
          // Failure callback, ignore normally as it triggers on every frame
        }
      );
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner on cleanup. ", error);
        });
      }
    };
  }, [scannerVisible]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (personalCode.length !== 4) {
      toast.error("Personal Code must be 4 digits.");
      return;
    }

    setLoading(true);

    fetch("/api/v1/checkins/qr-fichaje", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ token: totpToken, personalCode: personalCode }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return response.text().then(text => {
            throw new Error(text || "Error processing check-in");
          });
        }
      })
      .then((data) => {
        setLoading(false);
        const type = data.checkInType === "ENTRADA" ? "Checked In" : "Checked Out";
        toast.success(`Successfully ${type} at ${new Date(data.timestamp).toLocaleTimeString()}`);
        // Reset state for the next user
        setTotpToken(null);
        setPersonalCode('');
        setScannerVisible(true);
      })
      .catch((error) => {
        setLoading(false);
        toast.error(error.message);
      });
  };

  const handleCancel = () => {
    setTotpToken(null);
    setPersonalCode('');
    setScannerVisible(true);
  };

  return (
    <div className="ba-container justify-content-center">
      <div className="ba-card ba-card-form my-auto mx-auto" style={{ maxWidth: '500px' }}>
        <div className="ba-card-header text-center">
          <h2>ShiftSync Scanner</h2>
        </div>

        {scannerVisible ? (
          <div>
            <p className="text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Scan the QR code displayed on the access screen.
            </p>
            <div id="qr-reader" style={{ width: '100%', borderRadius: '15px', overflow: 'hidden' }}></div>
          </div>
        ) : loading ? (
          <CardGhostLoader />
        ) : (
          <Form onSubmit={handleSubmit} className="mt-4">
            <h4 className="text-center mb-4 text-white">Enter your 4-digit PIN</h4>
            <FormGroup className="text-center">
              <Input
                type="number"
                inputMode="numeric"
                name="personalCode"
                id="personalCode"
                placeholder="0000"
                value={personalCode}
                onChange={(e) => {
                  if (e.target.value.length <= 4) {
                    setPersonalCode(e.target.value);
                  }
                }}
                className="ba-input"
                style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '15px', width: '200px', margin: '0 auto' }}
                autoFocus
              />
            </FormGroup>
            
            <div className="d-flex justify-content-between gap-3 mt-5">
              <button
                type="button"
                className="ba-btn ba-btn-secondary"
                style={{ flex: 1 }}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ba-btn ba-btn-primary"
                style={{ flex: 2 }}
                disabled={personalCode.length !== 4}
              >
                Confirm
              </button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}
