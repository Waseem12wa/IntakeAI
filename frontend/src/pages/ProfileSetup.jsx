// Customer Profile Creation page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmployerProfile from './EmployerProfile';

export default function ProfileSetup() {
  // Directly render EmployerProfile form
  return <EmployerProfile />;
}
