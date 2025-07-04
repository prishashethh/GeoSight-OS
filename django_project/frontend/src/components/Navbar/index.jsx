/**
 * GeoSight is UNICEF's geospatial web-based business intelligence platform.
 *
 * Contact : geosight-no-reply@unicef.org
 *
 * .. note:: This program is free software; you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation; either version 3 of the License, or
 *     (at your option) any later version.
 *
 * __author__ = 'irwan@kartoza.com'
 * __date__ = '13/06/2023'
 * __copyright__ = ('Copyright 2023, Unicef')
 */

/* ==========================================================================
   NAVBAR
   ========================================================================== */

import React, { Fragment, useRef } from 'react';
import { useSelector } from "react-redux";
import $ from 'jquery';
import i18n from "i18next";
import { useTranslation } from "react-i18next";

import User from './User'
import { EmbedConfig } from "../../utils/embed";
import { CogIcon, EditIcon, GlobeIcon, HelpIcon } from "../Icons";
import { ThemeButton } from "../Elements/Button";
import { HelpCenter } from "../HelpCenter";
import NotificationBadge from "../NotificationBadge";
import NotificationMaintenance from "../NotificationMaintenance";
import LanguageSelector from "../LanguageSelector";

import './style.scss';

/**
 * Navbar.
 * **/
export function GeoRepoIndicator() {
  const { username } = user;
  let referenceLayerData = null
  try {
    const {
      referenceLayer
    } = useSelector(state => state.dashboard.data);
    referenceLayerData = useSelector(state => state.referenceLayerData[referenceLayer?.identifier]);
  } catch (err) {

  }

  return <>
    {
      (username && preferences.georepo_using_user_api_key && preferences.georepo_api.api_key_is_public) ?
        referenceLayerData?.error ?
          <ThemeButton variant="Error" className='GeorepoApiKeyBtn'>
            <a href={'/admin/user/' + user.username + '/edit'}>
              Click to add GeoRepo API Key
            </a>
          </ThemeButton> : <></> :
        preferences.georepo_api.api_key_not_working ?
          <ThemeButton variant="Error" className='GeorepoApiKeyBtn'>
            <a href={'/admin/user/' + user.username + '/edit'}>
              Your API Key is invalid, update your api key.
            </a>
          </ThemeButton> :
          <ThemeButton
            id="GeorepoApiKeyBtnUpdate" variant="Error"
            className='GeorepoApiKeyBtn Hidden'>
            <a href={'/admin/user/' + user.username + '/edit'}>
              Your API Key is invalid, update your API key.
            </a>
          </ThemeButton>
    }
  </>
}

export default function NavBar({ minified }) {
  const helpPageRef = useRef(null);
  const { icon, favicon, site_title, site_type } = preferences;
  const { is_contributor } = user;
  const user_permission = useSelector(state => state.dashboard?.data?.user_permission);
  const { t, i18n } = useTranslation();

  // Set width of logo
  // Not working using css on firefox
  $('.page__header-logo').width($('.page__header-link').width());
  const canAccessAdmin = is_contributor && !EmbedConfig().id
  let dashboardEditUrl = null
  try {
    dashboardEditUrl = urls.dashboardEditUrl
  } catch (err) {

  }
  const homepageUrl = '/' + i18n.language.toLowerCase()
  const iconUrl = minified ? favicon : icon;
  return (
    <Fragment>
      <header>
        <div className={`NavHeader Nav-${site_type}`}>
          {
            iconUrl &&
            <div className='NavHeaderLogo'>
              <a
                href={homepageUrl}
                title={i18n.t('Homepage')}
                className='nav-header-link'
              >
                <img src={iconUrl} alt="Logo"/>
              </a>
            </div>
          }
          {
            !iconUrl && minified &&
            <div
              className='NavHeaderLogo'
              style={{ width: '100%', textAlign: "center" }}
            >
              <a
                href={homepageUrl}
                title={i18n.t('Homepage')}
                className='nav-header-link'
              >
                G
              </a>
            </div>
          }
          <a
            href={homepageUrl}
            title={i18n.t('Homepage')}
            className='NavHeaderLink'
          >
            {site_title} {site_type == 'Staging' ?
            <span className="ServerType">Staging</span> : ''}
          </a>
          <NotificationMaintenance/>
          <div className='Separator'></div>
          {
            headerTitle ?
              <div className='MiddleSection'>{headerTitle}</div> : null
          }
          <div className='Separator'></div>
          {
            user_permission?.edit && dashboardEditUrl ?
              <div className='LinkButton AdminLinkButton EditProjectLinkButton'
                   style={{ marginRight: "1rem" }}
                   title='Edit project'
              >
                <a href={dashboardEditUrl}>
                  <EditIcon/>
                </a>
              </div>
              : null
          }
          <GeoRepoIndicator/>
          {
            canAccessAdmin ? (
              <div className='LinkButton AdminLinkButton'
                   style={{ marginRight: "1rem" }}>
                <NotificationBadge/>
                <a href={urls.admin.dashboardList}>
                  <ThemeButton
                    variant="white"
                  >
                    <CogIcon/> {t("dashboardPage.adminPanelButton")}
                  </ThemeButton>
                </a>
              </div>
            ) : null
          }
          <LanguageSelector>
            <div
              className="AdminLinkButton LanguageSelector"
              style={{ marginRight: "1rem", cursor: "pointer" }}
            >
              <GlobeIcon/>
            </div>
          </LanguageSelector>
          <div className='HelpButton .SvgButton'>
            <a href='#' onClick={_ => {
              helpPageRef?.current.open()
            }}>
              <HelpIcon/>
            </a>
          </div>
          <User/>
        </div>
      </header>
      <HelpCenter ref={helpPageRef}/>
    </Fragment>
  )
}

