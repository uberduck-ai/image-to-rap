"use client";

import React, { useState } from "react";
import { useFormStatus, useFormState } from "react-dom";

import { generateRap } from "@/actions";
import { Button } from "./Button";
import Spinner from "./Spinner";

const formStyle = {
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  fontFamily: "Helvetica, Arial, sans-serif",
};

const inputStyle = {
  display: "block",
  margin: "10px 0",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  width: "100%",
};

const buttonStyle = {
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "16px",
};

const imageStyle = {
  maxWidth: "300px",
  height: "auto",
  marginTop: "10px",
  marginBottom: "10px",
};

const initialFormState = {
  message: "",
  lyrics: [[]],
  songUrl: "",
};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} variant="primary" type="submit">
      {pending && (
        <span className="mr-2">
          <Spinner />
        </span>
      )}
      Generate Rap
    </Button>
  );
};

export default function Form() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [state, formAction] = useFormState(generateRap, initialFormState);

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    const file = event.target.files![0];
    if (file && file.type.match("image.*")) {
      const reader = new FileReader();
      reader.onload = (e) => setImageSrc(e.target!.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <form
      className="bg-gray-300 dark:bg-gray-900"
      style={formStyle}
      action={formAction}
    >
      <div>
        <label htmlFor="subjectImage">Input Image</label>
        <input
          id="subjectImage"
          style={inputStyle}
          type="file"
          name="image"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imageSrc && <img src={imageSrc} alt="Preview" style={imageStyle} />}
      </div>
      <div>
        <label htmlFor="tone">Lyrics Tone</label>
        <select
          className="dark:bg-gray-900"
          id="tone"
          name="tone"
          style={inputStyle}
        >
          <option value="happy">Happy</option>
          <option value="sad">Sad</option>
          <option value="angry">Angry</option>
          <option value="loving">Loving</option>
          <option value="sarcastic">Sarcastic</option>
        </select>
      </div>
      <div>
        <SubmitButton />
      </div>
      <div className="grid grid-cols-2 mt-4">
        {state.songUrl && (
          <div>
            <audio controls src={state.songUrl} />
          </div>
        )}
        <div>
          {state.lyrics[0].map((line: string, idx: number) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </form>
  );
}
