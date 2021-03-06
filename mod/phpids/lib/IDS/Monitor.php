<?php

/**
 * PHPIDS
 * 
 * Requirements: PHP5, SimpleXML
 *
 * Copyright (c) 2007 PHPIDS group (http://php-ids.org)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; version 2 of the license.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * PHP version 5.1.6+
 * 
 * @category Security
 * @package  PHPIDS
 * @author   Mario Heiderich <mario.heiderich@gmail.com>
 * @author   Christian Matthies <ch0012@gmail.com>
 * @author   Lars Strojny <lars@strojny.net>
 * @license  http://www.gnu.org/licenses/lgpl.html LGPL
 * @link     http://php-ids.org/
 */

/**
 * Monitoring engine
 *
 * This class represents the core of the frameworks attack detection mechanism
 * and provides functions to scan incoming data for malicious appearing script
 * fragments.
 *
 * @category  Security
 * @package   PHPIDS
 * @author    Christian Matthies <ch0012@gmail.com>
 * @author    Mario Heiderich <mario.heiderich@gmail.com>
 * @author    Lars Strojny <lars@strojny.net>
 * @copyright 2007 The PHPIDS Group
 * @license   http://www.gnu.org/licenses/lgpl.html LGPL
 * @version   Release: $Id:Monitor.php 517 2007-09-15 15:04:13Z mario $
 * @link      http://php-ids.org/
 */
class IDS_Monitor
{

    /**
     * Tags to define what to search for
     *
     * Accepted values are xss, csrf, sqli, dt, id, lfi, rfe, spam, dos
     *
     * @var array
     */
    private $tags = null;

    /**
     * Request array
     *
     * Array containing raw data to search in
     *
     * @var array
     */
    private $request = null;

    /**
     * Container for filter rules
     *
     * Holds an instance of IDS_Filter_Storage
     *
     * @var object
     */
    private $storage = null;

    /**
     * Results
     *
     * Holds an instance of IDS_Report which itself provides an API to
     * access the detected results
     *
     * @var object
     */
    private $report = null;

    /**
     * Scan keys switch
     *
     * Enabling this property will cause the monitor to scan both the key and
     * the value of variables
     *
     * @var boolean
     */
    public $scanKeys = false;

    /**
     * Exception container
     *
     * Using this array it is possible to define variables that must not be
     * scanned. Per default, utmz google analytics parameters are permitted.
     *
     * @var array
     */
    private $exceptions = array(
        '__utmz',
        '__utmc'
    );

    /**
     * Constructor
     *
     * @param array  $request array to scan
     * @param object $init    instance of IDS_Init
     * @param array  $tags    list of tags to which filters should be applied
     * 
     * @return void
     */
    public function __construct(array $request, IDS_Init $init, 
        array $tags = null) 
    {

        if (!empty($request)) {
            $this->storage = new IDS_Filter_Storage($init);
            $this->request = $request;
            $this->tags    = $tags;

            if ($init) {
                $this->scanKeys   = $init->config['General']['scan_keys'];
                $this->exceptions = $init->config['General']['exceptions'];
            }
        }

        if (!is_writeable($init->config['General']['tmp_path'])) {
            throw new Exception(
                'Please make sure the IDS/tmp folder is writable'
            );
        }

        include_once 'IDS/Report.php';
        $this->report = new IDS_Report;
    }

    /**
     * Starts the scan mechanism
     *
     * @return object IDS_Report
     */
    public function run()
    {
        if (!empty($this->request)) {
            foreach ($this->request as $key => $value) {
                $this->_iterate($key, $value);
            }
        }

        return $this->getReport();
    }

    /**
     * Iterates through given data and delegates it to IDS_Monitor::_detect() in
     * order to check for malicious appearing fragments
     *
     * @param mixed $key   the former array key
     * @param mixed $value the former array value
     * 
     * @return void
     */
    private function _iterate($key, $value) 
    {

        if (!is_array($value)) {
            if (is_string($value)) {

                if ($filter = $this->_detect($key, $value)) {
                    include_once 'IDS/Event.php';
                    $this->report->addEvent(new IDS_Event($key,
                                                          $value,
                                                           $filter));
                }
            }
        } else {
            foreach ($value as $subKey => $subValue) {
                $this->_iterate($key . '.' . $subKey, $subValue);
            }
        }
    }

    /**
     * Checks whether given value matches any of the supplied filter patterns
     *
     * @param mixed $key   the key of the value to scan
     * @param mixed $value the value to scan
     * 
     * @return bool|array false or array of filter(s) that matched the value
     */
    private function _detect($key, $value) 
    {

        /*
         * to increase performance, only start detection if value
         * isn't alphanumeric 
         */ 
        if (preg_match('/[^\w\s\/]+/ims', $value) && !empty($value)) {

            if (in_array($key, $this->exceptions, true)) {
                return false;
            }

            // check for magic quotes and remove them if necessary
            $value = get_magic_quotes_gpc() ? stripslashes($value) : $value;

            // use the converter
            include_once 'IDS/Converter.php';
            $value     = IDS_Converter::runAll($value);
            $key       = $this->scanKeys ? IDS_Converter::runAll($key) : $key;
            $filters   = array();
            $filterSet = $this->storage->getFilterSet();
            foreach ($filterSet as $filter) {
            
                /*
                 * in case we have a tag array specified the IDS will only
                 * use those filters that are meant to detect any of the 
                 * defined tags
                 */
                if (is_array($this->tags)) {
                    if (array_intersect($this->tags, $filter->getTags())) {
                        if ($this->_match($key, $value, $filter)) {
                            $filters[] = $filter;
                        }
                    }
                } else {
                    if ($this->_match($key, $value, $filter)) {
                        $filters[] = $filter;
                    }
                }
            }

            return empty($filters) ? false : $filters;
        }
    }

    /**
     * Matches given value and/or key against given filter
     *
     * @param mixed  $key    the key to optionally scan
     * @param mixed  $value  the value to scan
     * @param object $filter the filter object
     * 
     * @return boolean
     */
    private function _match($key, $value, $filter) 
    {
        if ($this->scanKeys) {
            if ($filter->match($key)) {
                return true;
            }
        }

        if ($filter->match($value)) {
            return true;
        }

        return false;
    }

    /**
     * Sets exception array
     *
     * @param mixed $exceptions the thrown exceptions
     * 
     * @return void
     */
    public function setExceptions($exceptions) 
    {
        if (!is_array($exceptions)) {
            $exceptions = array($exceptions);
        }

        $this->exceptions = $exceptions;
    }

    /**
     * Returns exception array
     *
     * @return array
     */
    public function getExceptions() 
    {
        return $this->exceptions;
    }

    /**
     * Returns report object providing various functions to work with 
     * detected results
     *
     * @return object IDS_Report
     */
    public function getReport() 
    {
        return $this->report;
    }
}

/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * End:
 */
