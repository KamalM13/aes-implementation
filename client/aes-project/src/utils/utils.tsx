import { toast } from "sonner";
import React from "react";
import { t } from "i18next";
import imageCompression from "browser-image-compression";

export const CName = "Neena";
export const CLogo = "/logo.png";
export const CLogoAlt = "Neena Logo";
export const CTaxNo = "582-473-233";
export const CEmail = "";
export const CPhone = "";
export const CAddress = "";
export const CDescription = "";
export const CFacebook = "";
export const CWhatsApp = "";
export const CInstagram = "";
export const CLinkedin = "";
export const CNumbers = [];
export const CBranches = [];

export const DisplaySonner = (
  notification: any,
  label = "Close",
  onClick?: any
) => {
  if (notification) {
    const timestamp = new Date().toLocaleString();
    toast(t(notification), {
      description: timestamp,
      action: {
        label: label,
        onClick: onClick,
      },
    });
  }
};

export const formatContent = (text: string) => {
  return text.split("\n").map((str, index) => (
    <React.Fragment key={index}>
      {str}
      <br />
    </React.Fragment>
  ));
};

export const uploadFiles = async (files: any) => {
  const FilesUrls = Array.isArray(files) ? files : [files];
  const uploadedUrls = [];

  for (const file of FilesUrls) {
    const formData = new FormData();

    try {
      if (file.type.startsWith("image/")) {
        // Check if file is an image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        };

        const compressedImage = await imageCompression(file, options);
        formData.append("file", compressedImage);
      } else {
        // For non-image files, append the original file
        formData.append("file", file);
      }

      formData.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET_MAIN);

      const response = await fetch(import.meta.env.VITE_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      uploadedUrls.push(data.secure_url);
    } catch (error) {
      console.error("Error processing or uploading file:", error);
    }
  }

  return uploadedUrls;
};

